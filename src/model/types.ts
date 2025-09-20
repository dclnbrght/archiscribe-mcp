export interface ViewObject {
  id: string;
  name: string;
  type?: string;
  viewpoint?: string;
  documentation?: string;
  properties?: Record<string, string>;
  elements?: string[];
  relationships?: string[];
  nodeHierarchy?: Array<{ parentElement: string; childElement: string }>;
}

export interface ElementObject {
  id: string;
  name: string;
  type?: string;
  documentation?: string;
  properties?: Record<string, string>;
  inViews?: string[];          // IDs of views containing this element
  outgoingRelations?: string[]; // IDs of relationships where this element is the source
  incomingRelations?: string[]; // IDs of relationships where this element is the target
}

export interface RelationshipObject {
  id: string;
  sourceId: string;
  targetId: string;
  type?: string;
  name?: string;
  documentation?: string;
  properties?: Record<string,string>;
}

export interface ModelData {
  views: ViewObject[];
  elements: ElementObject[];
  relationships: RelationshipObject[];
}
