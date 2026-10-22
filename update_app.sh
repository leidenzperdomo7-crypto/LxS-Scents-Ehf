# 1. Reduce space between hero and boutique
sed -i 's/pb-12 sm:pb-16 flex flex-col/pb-4 sm:pb-6 flex flex-col/g' src/App.tsx
sed -i 's/pt-3 sm:pt-10/pt-2 sm:pt-5/g' src/App.tsx

# 3. Mánudagur-Föstudagur
sed -i 's/monFri: "Mánudagur - Föstudagur: 10:00 - 18:00"/monFri: "MÁN - FÖS: 10:00 - 18:00"/g' src/App.tsx

# 4. Opening hours space
sed -i 's/className="space-y-2.5"/className="space-y-0.5"/g' src/App.tsx
sed -i 's/className="py-0.5 tracking-wider"/className="tracking-wider"/g' src/App.tsx

# 5. UM OKKUR space
sed -i 's/className="space-y-3.5 font-sans/className="space-y-1 font-sans/g' src/App.tsx
sed -i 's/className="pb-1"/className=""/g' src/App.tsx

# 6. Legal policies space
# already covered by space-y-3.5 replacement above (since both are space-y-3.5)

# Outer wrapper spacing in the footer
sed -i 's/className="space-y-4 text-left"/className="space-y-1.5 text-left"/g' src/App.tsx
sed -i 's/className="space-y-4"/className="space-y-1.5"/g' src/App.tsx

# 7. Add whitespace-nowrap to Legal buttons
sed -i 's/className="cursor-pointer text-center md:text-left hover:text-gold-600 hover:underline transition-colors uppercase tracking-wider duration-200"/className="cursor-pointer text-center md:text-left hover:text-gold-600 hover:underline transition-colors uppercase tracking-wider duration-200 flex whitespace-nowrap"/g' src/App.tsx

