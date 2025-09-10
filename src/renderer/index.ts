import { ViewObject, ElementObject, RelationshipObject, ModelData } from '../model/types';

export function renderViewListMarkdown(views: ViewObject[]): string {
  if (!views || views.length === 0) return '# Views\n\n_No views found_';
  const lines: string[] = ['# ArchiMate Views', ''];
  for (const v of views) {
    lines.push(`- ${v.name}`);
  }
  return lines.join('\n');
}

function findElementById(model: ModelData, id: string): ElementObject | undefined {
  return model.elements.find(e => e.id === id);
}

function findRelationshipById(model: ModelData, id: string) : RelationshipObject | undefined {
  return model.relationships.find(r => r.id === id);
}

export function renderViewDetailsMarkdownFromModel(model: ModelData, view: ViewObject): string {
  const lines: string[] = [];
  lines.push(`# ArchiMate View name: ${view.name}`, '');
  if (view.viewpoint) {
    lines.push(`> Viewpoint: ${view.viewpoint}`, '');
  }
  if (view.documentation) lines.push(view.documentation, '');

  lines.push('## Elements', '');
  if (!view.elements || view.elements.length === 0) {
    lines.push('_No elements_');
  } else {
    for (const eid of view.elements) {
      const el = findElementById(model, eid);
      if (!el) continue;
      lines.push(`### ${el.name}`);
      if (el.type) lines.push(`- Type: ${el.type}`);
      if (el.documentation) lines.push(`- Documentation: ${el.documentation}`);
      if (el.properties && Object.keys(el.properties).length > 0) {
        lines.push('- Properties:');
        for (const [k, v] of Object.entries(el.properties)) {
          lines.push(`  - ${k}: ${v}`);
        }
      }
      lines.push('');
    }
  }

  lines.push('## Relationships', '');
  
  // Collect explicit relationships
  const explicitRels: string[] = [];
  if (view.relationships && view.relationships.length > 0) {
    for (const rid of view.relationships) {
      const r = findRelationshipById(model, rid);
      if (!r) continue;
      const source = findElementById(model, r.sourceId);
      const target = findElementById(model, r.targetId);
      const srcName = source ? source.name : r.sourceId;
      const tgtName = target ? target.name : r.targetId;
      explicitRels.push(`- From **${srcName}** to **${tgtName}**`);
      if (r.type) explicitRels.push(`  - Type: ${r.type}`);
      if (r.name) explicitRels.push(`  - Name: ${r.name}`);
      if (r.documentation) explicitRels.push(`  - Documentation: ${r.documentation}`);
      if (r.properties && Object.keys(r.properties).length > 0) {
        explicitRels.push('  - Properties:');
        for (const [k, v] of Object.entries(r.properties)) explicitRels.push(`    - ${k}: ${v}`);
      }
      explicitRels.push('');
    }
  }

  // Collect implicit relationships from node hierarchy
  const implicitRels: string[] = [];
  if (view.nodeHierarchy && view.nodeHierarchy.length > 0) {
    for (const hierarchy of view.nodeHierarchy) {
      const parent = findElementById(model, hierarchy.parentElement);
      const child = findElementById(model, hierarchy.childElement);
      const parentName = parent ? parent.name : hierarchy.parentElement;
      const childName = child ? child.name : hierarchy.childElement;
      
      // Find any relationship between the two elements (first match)
      const implicitRel = model.relationships.find(r => 
        (r.sourceId === hierarchy.parentElement && r.targetId === hierarchy.childElement) ||
        (r.sourceId === hierarchy.childElement && r.targetId === hierarchy.parentElement)
      );
      
      implicitRels.push(`- From **${parentName}** to **${childName}**`);
      if (implicitRel) {
        implicitRels.push(`  - Type: ${implicitRel.type} (implicit from view nesting)`);
        if (implicitRel.name) implicitRels.push(`  - Name: ${implicitRel.name}`);
        if (implicitRel.documentation) implicitRels.push(`  - Documentation: ${implicitRel.documentation}`);
        if (implicitRel.properties && Object.keys(implicitRel.properties).length > 0) {
          implicitRels.push('  - Properties:');
          for (const [k, v] of Object.entries(implicitRel.properties)) implicitRels.push(`    - ${k}: ${v}`);
        }
      } else {
        implicitRels.push(`  - Type: Containment (implicit from view nesting)`);
      }
      implicitRels.push('');
    }
  }

  // Output relationships
  if (explicitRels.length === 0 && implicitRels.length === 0) {
    lines.push('_No relationships_');
  } else {
    if (explicitRels.length > 0) {
      lines.push(...explicitRels);
    }
    if (implicitRels.length > 0) {
      lines.push(...implicitRels);
    }
  }

  return lines.join('\n');
}