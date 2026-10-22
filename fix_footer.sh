sed -i 's/{pf.openingHoursTitle}/{pf.openingHoursTitle}/g' src/App.tsx
# Target the specific block in the footer
sed -i 's/{\/\* Col 1: Left Side - Opening Hours \*\/}\n            <div className="space-y-4">/{\/\* Col 1: Left Side - Opening Hours \*\/}\n            <div className="space-y-4 text-left md:text-left">/g' src/App.tsx
