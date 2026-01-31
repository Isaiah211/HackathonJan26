export const interventions = [
  {
    id: 'bike_lane',
    type: 'physical',
    name: 'Bike Lane',
    description: 'Dedicated cycling infrastructure along existing roads.',
    impacts: [
      { label: 'Traffic congestion', change: 'Decrease', direction: 'down' },
      { label: 'Physical activity', change: 'Increase', direction: 'up' },
      { label: 'Street safety', change: 'Increase', direction: 'up' }
    ]
  },
  {
    id: 'affordable_housing',
    type: 'physical',
    name: 'Affordable Housing',
    description: 'Residential units with below-market rent.',
    impacts: [
      { label: 'Housing availability', change: 'Increase', direction: 'up' },
      { label: 'Rent pressure', change: 'Decrease', direction: 'down' },
      { label: 'Transit demand', change: 'Increase', direction: 'up' }
    ]
  },
  {
    id: 'green_space',
    type: 'physical',
    name: 'Public Green Space',
    description: 'Parks and recreational areas accessible to residents.',
    impacts: [
      { label: 'Urban heat', change: 'Decrease', direction: 'down' },
      { label: 'Air quality', change: 'Increase', direction: 'up' },
      { label: 'Mental health access', change: 'Increase', direction: 'up' }
    ]
  },
  {
    id: 'grocery_store',
    type: 'physical',
    name: 'Grocery Store',
    description: 'Local food access within walking distance.',
    impacts: [
      { label: 'Food access', change: 'Increase', direction: 'up' },
      { label: 'Household travel time', change: 'Decrease', direction: 'down' },
      { label: 'Local employment', change: 'Increase', direction: 'up' }
    ]
  },
  {
    id: 'bus_stop',
    type: 'physical',
    name: 'Bus Stop',
    description: 'Public transit access point.',
    impacts: [
      { label: 'Transit accessibility', change: 'Increase', direction: 'up' },
      { label: 'Car dependency', change: 'Decrease', direction: 'down' },
      { label: 'Commute options', change: 'Increase', direction: 'up' }
    ]
  },
  {
    id: 'civic_app',
    type: 'digital',
    name: 'Civic Reporting App',
    description: 'Mobile app for reporting local infrastructure issues.',
    impacts: [
      { label: 'Issue response time', change: 'Decrease', direction: 'down' },
      { label: 'Resident engagement', change: 'Increase', direction: 'up' },
      { label: 'Government transparency', change: 'Increase', direction: 'up' }
    ]
  },
  {
    id: 'transit_tracker',
    type: 'digital',
    name: 'Transit Tracker',
    description: 'Real-time bus and transit arrival information.',
    impacts: [
      { label: 'Wait time uncertainty', change: 'Decrease', direction: 'down' },
      { label: 'Transit ridership', change: 'Increase', direction: 'up' },
      { label: 'Commuter satisfaction', change: 'Increase', direction: 'up' }
    ]
  },
  {
    id: 'food_finder',
    type: 'digital',
    name: 'Food Pantry Locator',
    description: 'Map of food assistance resources and availability.',
    impacts: [
      { label: 'Food security awareness', change: 'Increase', direction: 'up' },
      { label: 'Resource access barriers', change: 'Decrease', direction: 'down' },
      { label: 'Community connections', change: 'Increase', direction: 'up' }
    ]
  }
]
