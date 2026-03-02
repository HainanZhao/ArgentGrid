/**
 * Shared utilities for Storybook stories
 */

export const LOCATION_FLAGS: Record<string, string> = {
  'New York': '🇺🇸 New York',
  'San Francisco': '🇺🇸 San Francisco',
  London: '🇬🇧 London',
  Singapore: '🇸🇬 Singapore',
  Remote: '🌐 Remote',
  Berlin: '🇩🇪 Berlin',
  Tokyo: '🇯🇵 Tokyo',
};

export const DEPARTMENT_EMOJIS: Record<string, string> = {
  Engineering: '⚙️ Engineering',
  Sales: '💰 Sales',
  Marketing: '📣 Marketing',
  HR: '👥 HR',
  Finance: '📈 Finance',
  Design: '🎨 Design',
  Operations: '🏢 Operations',
  Support: '🎧 Support',
};

export const ROLE_EMOJIS: Record<string, string> = {
  Engineer: '💻 Engineer',
  'Software Engineer': '💻 Software Engineer',
  Manager: '👔 Manager',
  Director: '🏢 Director',
  VP: '💎 VP',
  Intern: '🎓 Intern',
  Analyst: '📊 Analyst',
  Lead: '🥇 Lead',
};

/**
 * Common value formatter for location columns to add flags
 */
export const locationValueFormatter = (params: any) => {
  return LOCATION_FLAGS[params.value] ?? params.value;
};

/**
 * Common value formatter for department columns to add emojis
 */
export const departmentValueFormatter = (params: any) => {
  return DEPARTMENT_EMOJIS[params.value] ?? params.value;
};

/**
 * Common value formatter for role columns to add emojis
 */
export const roleValueFormatter = (params: any) => {
  return ROLE_EMOJIS[params.value] ?? params.value;
};

/**
 * Standard locations for mock data generation
 */
export const STORY_LOCATIONS = [
  'New York',
  'San Francisco',
  'London',
  'Singapore',
  'Remote',
  'Berlin',
  'Tokyo',
];

/**
 * Standard departments for mock data generation
 */
export const STORY_DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'HR',
  'Finance',
  'Design',
  'Operations',
  'Support',
];

/**
 * Standard roles for mock data generation
 */
export const STORY_ROLES = ['Engineer', 'Manager', 'Director', 'VP', 'Intern', 'Analyst', 'Lead'];
