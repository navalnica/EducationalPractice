import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;

public class Main {

    public static void main(String[] args) throws IOException {

        JSPhotoPostsGenerator g = new JSPhotoPostsGenerator();
        String posts = g.generatePosts(20);

        PrintWriter pw = new PrintWriter(new FileWriter("output.txt"));
        pw.println(posts);

        pw.flush();
        pw.close();

    }

}
