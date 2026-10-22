# 1. Main image space
sed -i 's/pt-\[100px\] sm:pt-\[120px\]/pt-[56px] sm:pt-[120px]/g' src/App.tsx

# 2. Discount popup top image removal on mobile
sed -i 's/className="relative w-full md:w-1\/2 bg-\[#f5f2eb\] border-b md:border-b-0 md:border-r border-neutral-300 min-h-\[220px\] md:min-h-\[440px\] flex flex-col items-center justify-center p-8 select-none"/className="relative hidden md:flex w-full md:w-1\/2 bg-[#f5f2eb] border-b md:border-b-0 md:border-r border-neutral-300 min-h-[220px] md:min-h-[440px] flex-col items-center justify-center p-8 select-none"/g' src/App.tsx

# 3. Footer gap and afgreidslutimar
sed -i 's/className="grid grid-cols-3 gap-2 sm:gap-12 text-center md:text-left text-\[8px\] sm:text-\[13px\] tracking-widest border-b border-gold-500\/10 pb-12"/className="grid grid-cols-3 gap-6 sm:gap-12 text-center md:text-left text-[8px] sm:text-[13px] tracking-widest border-b border-gold-500\/10 pb-12"/g' src/App.tsx

sed -i 's/<div className="space-y-4">/<div className="space-y-4 text-left md:text-left">/g' src/App.tsx

# 4. Copyright one line
sed -i 's/<p className="text-center text-\[9px\] sm:text-\[13px\] text-\[#4c4a45\]">/<p className="text-center text-[7.5px] sm:text-[13px] text-[#4c4a45] whitespace-nowrap">/g' src/App.tsx

