outputFile="names.txt"
rm $outputFile
for file in *.jpeg *.jpg
do
     printf "\"photos/$file\", " >> $outputFile
done 
 
