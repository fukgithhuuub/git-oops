/**
 * Data layer for fetching and processing scenarios
 */

const DATA_URL = './data/scenarios.json';

class DataService {
  constructor() {
    this.scenarios = [];
    this.categories = new Set();
    this.loaded = false;
  }

  async loadData() {
    if (this.loaded) return this.scenarios;

    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) {
        throw new Error(`Failed to load scenarios: ${response.status}`);
      }
      this.scenarios = await response.json();
      this.loaded = true;

      // Extract unique categories
      this.scenarios.forEach(s => {
        if (s.category) this.categories.add(s.category);
      });

      return this.scenarios;
    } catch (error) {
      console.error("Error loading data:", error);
      // If we're on file:// or something similar where fetch fails,
      // we might want a fallback or clear error message.
      document.body.innerHTML += `<div style="color:red; text-align:center; padding: 2rem;">Error loading data. Must run via HTTP server.</div>`;
      return [];
    }
  }

  getAll() {
    return this.scenarios;
  }

  getById(id) {
    return this.scenarios.find(s => s.id === id);
  }

  getByCategory(category) {
    if (!category) return this.scenarios;
    return this.scenarios.filter(s => s.category === category);
  }
}

// Export singleton instance
const dataService = new DataService();
window.dataService = dataService;
