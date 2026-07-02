import { AppData } from "../types";

const STORAGE_KEY = "wellness_finance_app_data";

export const StorageService = {
  saveData: (data: AppData): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Error saving data to local storage", e);
    }
  },

  loadData: (): AppData | null => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        return JSON.parse(item) as AppData;
      }
    } catch (e) {
      console.error("Error loading data from local storage", e);
    }
    return null;
  },

  clearData: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  exportData: (data: AppData): void => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'finance_data_export.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  },

  importData: (file: File): Promise<AppData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          // basic validation could go here
          resolve(data as AppData);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
};
