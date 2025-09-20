import { ModelData, ViewObject, ElementObject, RelationshipObject } from './types';
import { readFileSync } from 'fs';
import { watchFile } from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { getLogger } from '../utils/logger';

const logger = getLogger();

function attr(obj: any, name: string) {
  if (!obj) return undefined;
  const keys = Object.keys(obj);
  for (const k of keys) {
    if (k.toLowerCase().endsWith(name.toLowerCase())) return obj[k];
  }
  return undefined;
}

function asArray<T>(v: any): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

export class ModelLoader {
  private path: string;
  private cache?: ModelData;
  private watcherInitialized: boolean = false;

  constructor(path: string) {
    this.path = path;
    this.initWatcher();
  }

  private initWatcher() {
    if (this.watcherInitialized) return;
    try {
        watchFile(this.path, { persistent: true, interval: 5000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          this.cache = undefined;
          // Log to output when file watcher triggers, with timestamp
          const ts = new Date().toISOString();
          logger.log('info', 'model.file.update', { path: this.path });
        }
      });
      this.watcherInitialized = true;
    } catch (err) {
      // Ignore watcher errors
    }
  }

  load(): ModelData {
    if (this.cache) return this.cache;
    try {
      const xml = readFileSync(this.path, 'utf8');
      const parsed = this.parseXml(xml);
      const model = parsed.model || parsed;

      const propDefs = this.parsePropertyDefinitions(model);
      const elements = this.parseElements(model, propDefs);
      const relationships = this.parseRelationships(model, propDefs);
      const views = this.parseViews(model, propDefs);

      this.cache = { views, elements, relationships } as ModelData;
      logger.log('info', 'model.load.success', { path: this.path, views: views.length, elements: elements.length, relationships: relationships.length });
      return this.cache;
    } catch (err) {
      this.cache = { views: [], elements: [], relationships: [] };
      logger.log('warn', 'model.load.fail', { path: this.path, error: (err as Error)?.message || String(err) });
      return this.cache;
    }
  }

  private parseXml(xml: string): any {
    const parser = new XMLParser({ 
      ignoreAttributes: false, 
      attributeNamePrefix: '@', 
      textNodeName: '#text', 
      removeNSPrefix: true 
    });
    return parser.parse(xml);
  }

  private parsePropertyDefinitions(model: any): Map<string, string> {
    const propDefsRaw = asArray<any>(model.propertyDefinitions && model.propertyDefinitions.propertyDefinition);
    const propDefs = new Map<string, string>();
    for (const pd of propDefsRaw) {
      const id = attr(pd, 'identifier') || attr(pd, 'id');
      const name = pd.name ? (typeof pd.name === 'string' ? pd.name : pd.name['#text']) : undefined;
      if (id && name) propDefs.set(id, name);
    }
    return propDefs;
  }

  private parseProperties(propertiesData: any, propDefs: Map<string, string>): Record<string, string> {
    const props: Record<string, string> = {};
    const propsRaw = asArray<any>(propertiesData && propertiesData.property);
    for (const p of propsRaw) {
      const ref = attr(p, 'propertyDefinitionRef');
      const val = p.value ? (typeof p.value === 'string' ? p.value : p.value['#text']) : undefined;
      if (ref) {
        const pname = propDefs.get(ref) || ref;
        if (val !== undefined) props[pname] = val;
      }
    }
    return props;
  }

  private parseElements(model: any, propDefs: Map<string, string>): ElementObject[] {
    const elementsRaw = asArray<any>(model.elements && model.elements.element);
    const elements = elementsRaw.map((el: any) => {
      const id = attr(el, 'identifier') || attr(el, 'id');
      const type = attr(el, 'type');
      const name = el.name ? (typeof el.name === 'string' ? el.name : el.name['#text']) : id;
      const documentation = el.documentation ? (typeof el.documentation === 'string' ? el.documentation : el.documentation['#text']) : undefined;
      const properties = this.parseProperties(el.properties, propDefs);
      
      return { 
        id, 
        type, 
        name, 
        documentation, 
        properties,
        inViews: [],
        outgoingRelations: [],
        incomingRelations: []
      } as ElementObject;
    });

    // Post-process to populate relationship and view references
    const viewsRaw = asArray<any>((model.views && model.views.diagrams && model.views.diagrams.view) || (model.views && model.views.view));
    const relsRaw = asArray<any>(model.relationships && model.relationships.relationship);
    
    // Map for quick element lookup
    const elementMap = new Map(elements.map(e => [e.id, e]));
    
    // Add view references
    for (const view of viewsRaw) {
      const viewId = attr(view, 'identifier') || attr(view, 'id');
      const { elementsInView } = this.parseViewNodes(view.node);
      for (const elementId of elementsInView) {
        const element = elementMap.get(elementId);
        if (element && !element.inViews!.includes(viewId)) {
          element.inViews!.push(viewId);
        }
      }
    }
    
    // Add relationship references
    for (const rel of relsRaw) {
      const relId = attr(rel, 'identifier') || attr(rel, 'id');
      const sourceId = attr(rel, 'source');
      const targetId = attr(rel, 'target');
      
      const source = elementMap.get(sourceId);
      const target = elementMap.get(targetId);
      
      if (source && !source.outgoingRelations!.includes(relId)) {
        source.outgoingRelations!.push(relId);
      }
      if (target && !target.incomingRelations!.includes(relId)) {
        target.incomingRelations!.push(relId);
      }
    }
    
    return elements;
  }

  private parseRelationships(model: any, propDefs: Map<string, string>): RelationshipObject[] {
    const relsRaw = asArray<any>(model.relationships && model.relationships.relationship);
    return relsRaw.map((r: any) => {
      const id = attr(r, 'identifier') || attr(r, 'id');
      const type = attr(r, 'type');
      const source = attr(r, 'source');
      const target = attr(r, 'target');
      const name = r.name ? (typeof r.name === 'string' ? r.name : r.name['#text']) : undefined;
      const documentation = r.documentation ? (typeof r.documentation === 'string' ? r.documentation : r.documentation['#text']) : undefined;
      const properties = this.parseProperties(r.properties, propDefs);
      
      return { id, type, sourceId: source, targetId: target, name, documentation, properties } as RelationshipObject;
    });
  }

  private parseViews(model: any, propDefs: Map<string, string>): ViewObject[] {
    const viewsRaw = asArray<any>((model.views && model.views.diagrams && model.views.diagrams.view) || (model.views && model.views.view));
    return viewsRaw.map((v: any) => {
      const id = attr(v, 'identifier') || attr(v, 'id');
      const name = v.name ? (typeof v.name === 'string' ? v.name : v.name['#text']) : id;
      const documentation = v.documentation ? (typeof v.documentation === 'string' ? v.documentation : v.documentation['#text']) : undefined;
      const properties = this.parseProperties(v.properties, propDefs);
      const viewpoint = attr(v, 'viewpoint');
      
      const { elementsInView, nodeHierarchy } = this.parseViewNodes(v.node);
      const relsInView = this.parseViewConnections(v.connection);
      
      const type = attr(v, 'type');
      return { 
        id, 
        type, 
        name, 
        documentation, 
        properties, 
        viewpoint,
        elements: elementsInView, 
        relationships: relsInView, 
        nodeHierarchy 
      } as ViewObject;
    });
  }

  private parseViewNodes(nodeData: any): { elementsInView: string[], nodeHierarchy: Array<{ parentElement: string; childElement: string }> } {
    const nodeList = asArray<any>(nodeData);
    const elementsInView: string[] = [];
    const nodeHierarchy: Array<{ parentElement: string; childElement: string }> = [];
    
    // Recursive function to process nodes at any nesting level
    const processNode = (node: any, parentElementRef?: string) => {
      const eref = attr(node, 'elementRef') || attr(node, 'elementref');
      if (eref) {
        elementsInView.push(eref);
        if (parentElementRef) {
          nodeHierarchy.push({ parentElement: parentElementRef, childElement: eref });
        }
      }
      
      // Process nested nodes recursively
      const nested = asArray<any>(node.node);
      for (const nestedNode of nested) {
        processNode(nestedNode, eref);
      }
    };
    
    // Process all top-level nodes
    for (const n of nodeList) {
      processNode(n);
    }
    
    return { elementsInView, nodeHierarchy };
  }

  private parseViewConnections(connectionData: any): string[] {
    const connList = asArray<any>(connectionData);
    const relsInView: string[] = [];
    for (const c of connList) {
      const rref = attr(c, 'relationshipRef') || attr(c, 'relationshipref');
      if (rref) relsInView.push(rref);
    }
    return relsInView;
  }

  reload(): ModelData {
    this.cache = undefined;
    return this.load();
  }
}
