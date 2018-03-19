import java.util.HashSet;
import java.util.Iterator;
import java.util.Random;

public class JSPhotoPostsGenerator {

    private String[] users = {
            "arsieni", "admin", "koscia", "pasa"
    };

    private String[] descriptions = {
            "some fancy descriptions",
            "another dummy descriptions",
            "hope you enjoy reading those descriptions"
    };

    private String[] dates = {
            "2018-03-23T23:00:00",
            "2018-03-22T23:00:00",
            "2018-03-21T23:00:00",
            "2018-03-20T23:00:00"
    };

    private String[] photoLinks = {
            "/photos/karatkievic1.jpg",
            "/photos/karatkievic2.jpg",
            "/photos/karatkievic3.jpg"
    };

    private String[] hashtags = {
            "nature", "rest", "sunset", "car",
            "rain", "work", "evening", "comfort"
    };

    private Random random = new Random();
    private String lineSeparator = System.lineSeparator();
    private int counter = 0;

    private void appendFieldToPost(
            StringBuilder sb, String fieldName, String fieldValue,
            boolean wrapValueWithQuotation, boolean isLastLine) {

        sb.append('\t').append(fieldName).append(": ");

        if (wrapValueWithQuotation) {
            sb.append("'");
        }
        sb.append(fieldValue);
        if (wrapValueWithQuotation) {
            sb.append("'");
        }

        if (!isLastLine) {
            sb.append(",");
        }
        sb.append(lineSeparator);
    }

    private String createArrayOfStrings(String[] source, int num) {
        // all items in created array are unique
        StringBuilder sb = new StringBuilder();

        HashSet<String> set = new HashSet<>();
        for (int i = 0; i < num; i++) {
            while (true) {
                String cur = source[random.nextInt(source.length)];
                if (set.add(cur)) {
                    break;
                }
            }
        }

        sb.append("[ ");
        Iterator<String> i = set.iterator();
        while (i.hasNext()) {
            sb.append("'").append(i.next()).append("'");
            if (i.hasNext()) {
                sb.append(", ");
            } else {
                sb.append(" ]");
            }
        }

        return sb.toString();
    }

    private String createSinglePost() {
        StringBuilder sb = new StringBuilder();
        sb.append('{').append(lineSeparator);

        appendFieldToPost(sb, "id",
                Integer.toString(++counter), true, false);
        appendFieldToPost(sb, "user",
                users[random.nextInt(users.length)], true, false);
        appendFieldToPost(sb, "description",
                descriptions[random.nextInt(descriptions.length)], true, false);

        String date = "new Date('" + dates[random.nextInt(dates.length)] + "')";
        appendFieldToPost(sb, "createdAt", date
                , false, false);

        appendFieldToPost(sb, "photoLink",
                photoLinks[random.nextInt(photoLinks.length)], true, false);

        int tagsNumber = random.nextInt(5) + 1;
        if (tagsNumber > hashtags.length) {
            tagsNumber = hashtags.length;
        }
        appendFieldToPost(sb, "hashtags",
                createArrayOfStrings(hashtags, tagsNumber), false, false);

        int likesNumber = random.nextInt(users.length) + 1;
        appendFieldToPost(sb, "likesFrom",
                createArrayOfStrings(users, likesNumber), false, false);

        appendFieldToPost(sb, "active", "true", false, true);
        sb.append('}');

        return sb.toString();
    }

    public String generatePosts(int number) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < number - 1; i++) {
            sb.append(createSinglePost());
            sb.append(",").append(lineSeparator).append(lineSeparator);
        }
        sb.append(createSinglePost());
        sb.append(lineSeparator);

        return sb.toString();
    }

}
