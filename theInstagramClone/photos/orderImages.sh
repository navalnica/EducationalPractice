cnt=1
for file in *.jpeg *.jpg
do
     mv $file "img$cnt.jpeg"
     cnt=$[$cnt +1]
done 
