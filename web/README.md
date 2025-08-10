# RICE Prioritization App

A simple web application that helps you prioritize features using the RICE framework: **Reach × Impact × Confidence ÷ Effort**.

## Features

- **RICE Calculation**: Automatically calculates RICE scores using the standard formula
- **Real-time Updates**: Scores update instantly as you modify feature data
- **Auto-sorting**: Features are automatically sorted by RICE score (highest first)
- **Import/Export**: Support for CSV and JSON formats
- **Local Storage**: Your data is automatically saved and restored
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

## RICE Framework

The RICE score is calculated as: `(Reach × Impact × Confidence) ÷ Effort`

### Scales

- **Reach**: Number of customers affected per quarter
- **Impact**: 
  - Massive = 3.0
  - High = 2.0  
  - Medium = 1.0
  - Low = 0.5
  - Minimal = 0.25
- **Confidence**:
  - 100% = 1.0
  - 80% = 0.8
  - 50% = 0.5
- **Effort** (T-shirt sizing):
  - XS = 0.5 weeks
  - S = 1 week
  - M = 2 weeks
  - L = 4 weeks
  - XL = 8 weeks

## Usage

1. **Add Features**: Click "Add feature" to create a new entry
2. **Fill Data**: Enter the feature name, reach, impact, confidence, and effort
3. **View Scores**: RICE scores are calculated automatically and displayed
4. **Sort**: Features are automatically sorted by score (highest first)
5. **Import/Export**: Use the Import/Export buttons to share data
6. **Clear Data**: Use "Clear data" to reset all features

## Import/Export Formats

### CSV Format
```csv
name,reach,impact,confidence,effort,description
User Authentication,1000,High,80%,M,Implement OAuth login
Dark Mode,5000,Medium,100%,S,Add dark theme option
```

### JSON Format
```json
[
  {
    "name": "User Authentication",
    "reach": 1000,
    "impact": "High",
    "confidence": "80%",
    "effort": "M",
    "description": "Implement OAuth login"
  }
]
```

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
cd web
npm install
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS-in-JS (inline styles)
- **Testing**: Jest + React Testing Library
- **Storage**: localStorage

## Sample Data

Sample feature data is available in the `samples/` directory:
- `features.csv` - Example CSV file
- `features.json` - Example JSON file

You can import these files to see the app in action with sample data.

## Accessibility

The app includes:
- ARIA labels and roles for screen readers
- Keyboard navigation support
- Focus management
- Semantic HTML structure
- Color contrast compliance

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT License
