sed -i 's/text-\[10px\] leading-snug sm:leading-relaxed sm:text-base max-w-4xl mx-auto tracking-\[0.05em\] whitespace-pre-line/text-[7.5px] min-[375px]:text-[8px] sm:text-[10px] md:text-base leading-snug sm:leading-relaxed max-w-4xl mx-auto tracking-[0.05em] whitespace-pre md:whitespace-pre-line/g' src/App.tsx

# Make all the text in the footer smaller.
# The headings are text-[10px] sm:text-base. Make them text-[9px] sm:text-[14px]
sed -i 's/text-\[10px\] sm:text-base/text-[8px] sm:text-[13px]/g' src/App.tsx

# The links and content are text-[8px] sm:text-[13px] text-[9px]. Make them text-[7px] sm:text-[11px]
sed -i 's/text-\[8px\] sm:text-\[13px\]/text-[7px] sm:text-[11px]/g' src/App.tsx
sed -i 's/text-\[9px\] sm:text-\[13px\]/text-[7px] sm:text-[11px]/g' src/App.tsx

# Make LxS SCENTS text smaller
sed -i 's/text-\[14px\] sm:text-lg/text-[12px] sm:text-base/g' src/App.tsx
