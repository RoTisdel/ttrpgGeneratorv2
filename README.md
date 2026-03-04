🎲 TTRPG Character & Dice Utility

A Vue-based tabletop RPG utility for generating characters and rolling dice across multiple systems (D&D, Call of Cthulhu, and more).

✨ Features
🎲 Dice Roller

Supports multiple dice types:
d4
d6 (pip-based rendering)
d8
d10
d12
d20
d100

Animated roll transitions

Themed dice styles (DnD, Eldritch, etc.)

Numeric rendering for non-d6 dice

Glow & theme customization

🧙 Character Panels

D&D 4d6 drop lowest

Call of Cthulhu stat generation

Assignable stat rolls

Derived stat calculations

Themed UI per system

🎨 Theme System

Dynamic dice themes

CSS variable-driven styling

Support for custom glow, pip, and face colors

🛠 Tech Stack

Vue 3 (Composition API)

Vite

Modern CSS (custom properties)

SVG-based dice rendering

ESLint

🚀 Getting Started
Install dependencies
npm install
Run dev server
npm run dev

App will run at:

http://localhost:5173
Build for production
npm run build
📂 Project Structure
src/
components/
DiceRoller.vue
panels/
DndPanel.vue
CocPanel.vue
ResourcesPanel.vue
js/
themes.js
utils/
ttrpgConstants.js

## 👨‍💻 Author

Built by [Rory Tisdel].

This project explores Vue component architecture, animation state handling, and dynamic theming for interactive UI systems.
