import { describe, it, expect, beforeEach } from 'vitest';
import { ModelLoader } from '../../src/model/loader';
import { join } from 'path';

describe('ModelLoader', () => {
  // Always use the demo model for tests
  const testPath = join(__dirname, '..', '..', 'data', 'archimate-scribe-demo-model.xml');

  // Simple smoke tests
  describe('Simple', () => {
    it('can be instantiated', () => {
      const loader = new ModelLoader(testPath);
      expect(loader).toBeDefined();
    });

    it('can load a model', () => {
      const loader = new ModelLoader(testPath);
      const model = loader.load();
      expect(model).toBeDefined();
      expect(model.views).toBeDefined();
      expect(model.elements).toBeDefined();
      expect(model.relationships).toBeDefined();
    });
  });

  // Refactor verification tests
  describe('Refactored behavior', () => {
    it('successfully loads and parses model with refactored methods', () => {
      const loader = new ModelLoader(testPath);
      const model = loader.load();
      expect(model).toBeDefined();
      expect(Array.isArray(model.views)).toBe(true);
      expect(Array.isArray(model.elements)).toBe(true);
      expect(Array.isArray(model.relationships)).toBe(true);
      expect(model.views.length).toBeGreaterThan(0);
      expect(model.elements.length).toBeGreaterThan(0);
      expect(model.relationships.length).toBeGreaterThan(0);
    });

    it('maintains backward compatibility after refactoring', () => {
      const loader = new ModelLoader(testPath);
      const model = loader.load();
      model.elements.forEach(element => {
        expect(element).toHaveProperty('id');
        expect(element).toHaveProperty('name');
        expect(element).toHaveProperty('properties');
      });
      model.relationships.forEach(relationship => {
        expect(relationship).toHaveProperty('id');
        expect(relationship).toHaveProperty('sourceId');
        expect(relationship).toHaveProperty('targetId');
      });
      model.views.forEach(view => {
        expect(view).toHaveProperty('id');
        expect(view).toHaveProperty('name');
      });
    });

    it('correctly handles node hierarchies (parseViewNodes)', () => {
      const loader = new ModelLoader(testPath);
      const model = loader.load();
      const viewWithHierarchy = model.views.find(v => v.nodeHierarchy && v.nodeHierarchy.length > 0);
      if (viewWithHierarchy) {
        expect(viewWithHierarchy.nodeHierarchy).toBeDefined();
        expect(Array.isArray(viewWithHierarchy.nodeHierarchy)).toBe(true);
        viewWithHierarchy.nodeHierarchy!.forEach(h => {
          expect(typeof h.parentElement).toBe('string');
          expect(typeof h.childElement).toBe('string');
          expect(h.parentElement.length).toBeGreaterThan(0);
          expect(h.childElement.length).toBeGreaterThan(0);
        });
      }
    });

    it('preserves data integrity across relationships', () => {
      const loader = new ModelLoader(testPath);
      const model = loader.load();
      model.relationships.forEach(r => {
        const sourceExists = model.elements.some(e => e.id === r.sourceId);
        const targetExists = model.elements.some(e => e.id === r.targetId);
        expect(sourceExists).toBe(true);
        expect(targetExists).toBe(true);
      });
    });

    it('ensures unique IDs across elements/relationships/views', () => {
      const loader = new ModelLoader(testPath);
      const model = loader.load();
      const uniqueSize = (arr: string[]) => new Set(arr).size;
      const elementIds = model.elements.map(e => e.id);
      const relationshipIds = model.relationships.map(r => r.id);
      const viewIds = model.views.map(v => v.id);
      expect(uniqueSize(elementIds)).toBe(elementIds.length);
      expect(uniqueSize(relationshipIds)).toBe(relationshipIds.length);
      expect(uniqueSize(viewIds)).toBe(viewIds.length);
    });
  });
});

describe('ModelLoader', () => {
  let loader: ModelLoader;
  // Always use the demo model for tests
  const testPath = join(__dirname, '..', '..', 'data', 'archimate-scribe-demo-model.xml');

  beforeEach(() => {
    loader = new ModelLoader(testPath);
  });

  describe('Basic Functionality', () => {
    it('can be instantiated', () => {
      expect(loader).toBeDefined();
    });

    it('can load a model successfully', () => {
      const model = loader.load();
      expect(model).toBeDefined();
      expect(model.views).toBeDefined();
      expect(model.elements).toBeDefined();
      expect(model.relationships).toBeDefined();
    });

    it('parses sample XML and finds views/elements/relationships', () => {
      const model = loader.load();
      
      expect(model.views.length).toBeGreaterThanOrEqual(2);
      expect(model.elements.length).toBeGreaterThanOrEqual(4);
      expect(model.relationships.length).toBeGreaterThanOrEqual(4);
      
  // Look for a data flow style view in a case-insensitive, flexible way
  const dataflow = model.views.find(v => v.name && /data\s*flows?/i.test(v.name));
  expect(dataflow).toBeDefined();
      if (dataflow) {
        expect(dataflow.elements && dataflow.elements.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Caching Behavior', () => {
    it('handles caching correctly', () => {
      const model1 = loader.load();
      const model2 = loader.load();
      
      expect(model1).toBe(model2); // Should return same cached instance
      
      const model3 = loader.reload();
      expect(model3).not.toBe(model1); // Should create new instance after reload
    });
  });

  describe('Error Handling', () => {
    it('handles file not found gracefully', () => {
      const badLoader = new ModelLoader('/nonexistent/path.xml');
      const model = badLoader.load();
      
      expect(model).toEqual({
        views: [],
        elements: [],
        relationships: []
      });
    });
  });

  describe('Refactored Methods Verification', () => {
    it('correctly processes all data sections', () => {
      const model = loader.load();
      
      // Verify elements have required properties
      expect(model.elements.every(e => e.id)).toBe(true);
      expect(model.elements.every(e => e.name)).toBe(true);
      
      // Verify relationships have source and target
      expect(model.relationships.every(r => r.sourceId && r.targetId)).toBe(true);
      
      // Verify views have required properties
      expect(model.views.every(v => v.id && v.name)).toBe(true);
    });

    it('correctly parses view node hierarchies', () => {
      const model = loader.load();
      
      // Find a view with nested nodes
      const viewWithHierarchy = model.views.find(v => v.nodeHierarchy && v.nodeHierarchy.length > 0);
      
      if (viewWithHierarchy) {
        expect(viewWithHierarchy.nodeHierarchy).toBeDefined();
        expect(Array.isArray(viewWithHierarchy.nodeHierarchy)).toBe(true);
        
        // Verify hierarchy structure
        viewWithHierarchy.nodeHierarchy!.forEach(hierarchy => {
          expect(hierarchy.parentElement).toBeTruthy();
          expect(hierarchy.childElement).toBeTruthy();
        });
      }
    });

    it('maintains referential integrity', () => {
      const model = loader.load();
      
      model.relationships.forEach(relationship => {
        const sourceElement = model.elements.find(e => e.id === relationship.sourceId);
        const targetElement = model.elements.find(e => e.id === relationship.targetId);
        
        expect(sourceElement).toBeDefined();
        expect(targetElement).toBeDefined();
      });
    });

    it('ensures unique IDs across all object types', () => {
      const model = loader.load();
      
      const elementIds = model.elements.map(e => e.id);
      const relationshipIds = model.relationships.map(r => r.id);
      const viewIds = model.views.map(v => v.id);
      
      expect(new Set(elementIds).size).toBe(elementIds.length);
      expect(new Set(relationshipIds).size).toBe(relationshipIds.length);
      expect(new Set(viewIds).size).toBe(viewIds.length);
    });

    it('handles properties correctly', () => {
      const model = loader.load();
      
      // All elements should have properties object (even if empty)
      model.elements.forEach(element => {
        expect(element.properties).toBeDefined();
        expect(typeof element.properties).toBe('object');
      });
    });

    it('processes view references correctly', () => {
      const model = loader.load();
      
      model.views.forEach(view => {
        if (view.elements) {
          expect(Array.isArray(view.elements)).toBe(true);
          // Verify all referenced elements exist
          view.elements.forEach(elementId => {
            const element = model.elements.find(e => e.id === elementId);
            expect(element).toBeDefined();
          });
        }
        
        if (view.relationships) {
          expect(Array.isArray(view.relationships)).toBe(true);
          // Verify all referenced relationships exist  
          view.relationships.forEach(relId => {
            const relationship = model.relationships.find(r => r.id === relId);
            expect(relationship).toBeDefined();
          });
        }
      });
    });
  });

  describe('Data Quality Checks', () => {
    it('ensures all elements have names', () => {
      const model = loader.load();
      
      model.elements.forEach(element => {
        expect(element.name).toBeTruthy();
        expect(typeof element.name).toBe('string');
      });
    });

    it('ensures data structures are always arrays or objects', () => {
      const model = loader.load();
      
      expect(Array.isArray(model.views)).toBe(true);
      expect(Array.isArray(model.elements)).toBe(true);
      expect(Array.isArray(model.relationships)).toBe(true);
      
      model.elements.forEach(element => {
        expect(typeof element.properties).toBe('object');
      });
    });
  });
});
