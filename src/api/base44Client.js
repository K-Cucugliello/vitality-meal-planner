export const base44 = {
  entities: {
    Meal: {
      list: async () => [],
      create: async (data) => ({ id: Math.random(), ...data }),
    },
    PlannedMeal: {
      list: async () => [],
      create: async (data) => ({ id: Math.random(), ...data }),
      update: async (id, data) => ({ id, ...data }), // Added this line
      delete: async (id) => id,
    }
  }
};