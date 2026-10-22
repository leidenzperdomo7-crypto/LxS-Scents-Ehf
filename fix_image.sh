sed -i 's/text-\[7.5px\] min-\[375px\]:text-\[8px\] sm:text-\[10px\] md:text-base/text-[9.5px] min-[375px]:text-[10px] sm:text-[14px] md:text-lg/g' src/App.tsx

sed -i 's/src={IMAGES.hero}\n                alt="LxS SCENTS Hero Display"\n                referrerPolicy="no-referrer"\n                className="w-full h-auto block"/src={IMAGES.hero}\n                alt="LxS SCENTS Hero Display"\n                referrerPolicy="no-referrer"\n                className="w-full h-auto block scale-110 sm:scale-100 transform origin-top"/g' src/App.tsx
