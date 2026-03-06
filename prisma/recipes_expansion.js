const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const recipes = [
    {
        name: 'חומוס ביתי קלאסי',
        emoji: '🥘',
        image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=600&q=80',
        time: '45 דק',
        difficulty: 'בינוני',
        tags: ['lunch', 'vegan', 'healthy', 'israeli'],
        ingredients: [
            { name: 'גרגירי חומוס מבושלים', amount: 500, unit: 'grams' },
            { name: 'טחינה גולמית', amount: 1, unit: 'cups' },
            { name: 'מיץ לימון', amount: 2, unit: 'units' },
            { name: 'שום', amount: 3, unit: 'units' },
            { name: 'שמן זית', amount: 2, unit: 'units' }
        ],
        instructions: [
            'טוחנים את גרגירי החומוס במעבד מזון עד לקבלת מרקם חלק.',
            'מוסיפים טחינה, לימון ושום וממשיכים לעבד.',
            'מוסיפים מעט ממי הבישול של החומוס לקבלת המרקם הרצוי.',
            'מגישים עם שמן זית, פפריקה ופטרוזיליה מעל.'
        ]
    },
    {
        name: 'פלאפל ירוק',
        emoji: '🧆',
        image: 'https://images.unsplash.com/photo-1593001874117-c99c442b24e7?auto=format&fit=crop&w=600&q=80',
        time: '30 דק',
        difficulty: 'בינוני',
        tags: ['lunch', 'vegan', 'side', 'israeli'],
        ingredients: [
            { name: 'גרגירי חומוס מושרים', amount: 500, unit: 'grams' },
            { name: 'בצל', amount: 1, unit: 'units' },
            { name: 'פטרוזיליה', amount: 1, unit: 'units' },
            { name: 'שום', amount: 4, unit: 'units' },
            { name: 'שמן לטיגון', amount: 1, unit: 'units' }
        ],
        instructions: [
            'טוחנים במעבד מזון חומוס מושרה (לא מבושל!), בצל, ירק ושום.',
            'יוצרים כדורים קטנים מהעיסה.',
            'מטגנים בשמן עמוק וחם עד להזהבה עמוקה.',
            'מגישים בתוך פיתה עם טחינה וסלט.'
        ]
    },
    {
        name: 'שניצל של אמא',
        emoji: '🍗',
        image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80',
        time: '20 דק',
        difficulty: 'קל',
        tags: ['lunch', 'meat', 'comfort', 'israeli'],
        ingredients: [
            { name: 'חזה עוף', amount: 500, unit: 'grams' },
            { name: 'פירורי לחם', amount: 200, unit: 'grams' },
            { name: 'ביצים', amount: 2, unit: 'units' },
            { name: 'קמח', amount: 0.5, unit: 'cups' },
            { name: 'שמן לטיגון', amount: 1, unit: 'units' }
        ],
        instructions: [
            'טובלים כל נתח עוף בקמח, אחר כך בביצה טרופה ולבסוף בפירורי לחם.',
            'מהדקים היטב את פירורי הלחם לעוף.',
            'מטגנים במחבת עם שמן חם עד להזהבה משני הצדדים.',
            'סופגים עודפי שמן בנייר סופג ומגישים עם פלח לימון.'
        ]
    },
    {
        name: 'פתיתים "אורז בן גוריון"',
        emoji: '🍚',
        image: 'https://images.unsplash.com/photo-1512058560366-cd2429597e70?auto=format&fit=crop&w=600&q=80',
        time: '15 דק',
        difficulty: 'קל',
        tags: ['side', 'vegan', 'quick', 'israeli'],
        ingredients: [
            { name: 'פתיתים', amount: 1, unit: 'bags' },
            { name: 'בצל', amount: 1, unit: 'units' },
            { name: 'שמן', amount: 2, unit: 'units' },
            { name: 'מים רותחים', amount: 2, unit: 'cups' }
        ],
        instructions: [
            'מטגנים בצל קצוץ עד להזהבה.',
            'מוסיפים פתיתים ומטגנים קלות תוך ערבוב.',
            'מוסיפים מים רותחים ומלח, מכסים ומנמיכים את האש.',
            'מבשלים כ-6 דקות, מכבים את האש ומשאירים מכוסה עוד 5 דקות.'
        ]
    },
    {
        name: 'מג\'דרה ביתית מושלמת',
        emoji: '🥘',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
        time: '40 דק',
        difficulty: 'בינוני',
        tags: ['lunch', 'vegan', 'healthy', 'israeli'],
        ingredients: [
            { name: 'אורז לבן', amount: 1, unit: 'cups' },
            { name: 'עדשים חומות', amount: 0.5, unit: 'cups' },
            { name: 'בצל', amount: 3, unit: 'units' },
            { name: 'שמן', amount: 1, unit: 'units' },
            { name: 'כמון', amount: 1, unit: 'units' }
        ],
        instructions: [
            'מבשלים את העדשים עד לריכוך חלקי ומסננים.',
            'בסיר נפרד, מטגנים כמות נדיבה של בצל עד להשחמה.',
            'מוסיפים אורז, עדשים ותבלינים ומערבבים.',
            'מוסיפים מים ומבשלים כמו אורז רגיל עד שכל המים נספגים.'
        ]
    },
    {
        name: 'מקלובה צמחונית',
        emoji: '🥘',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
        time: '60 דק',
        difficulty: 'קשה',
        tags: ['dinner', 'vegetarian', 'israeli'],
        ingredients: [
            { name: 'אורז', amount: 2, unit: 'cups' },
            { name: 'כרובית', amount: 1, unit: 'units' },
            { name: 'תפוחי אדמה', amount: 2, unit: 'units' },
            { name: 'חצילים', amount: 1, unit: 'units' },
            { name: 'בצל', amount: 1, unit: 'units' }
        ],
        instructions: [
            'מטגנים או צולים בתנור את כל הירקות עד להזהבה.',
            'מסדרים בסיר שכבות: ירקות בתחתית, עליהם אורז מתובל.',
            'מוסיפים מים רותחים ומבשלים על אש קטנה כשעה.',
            'החלק הכי חשוב: הופכים את הסיר על מגש גדול ומגישים.'
        ]
    },
    {
        name: 'בורקס גבינה ביתי',
        emoji: '🥐',
        image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=600&q=80',
        time: '35 דק',
        difficulty: 'קל',
        tags: ['snack', 'vegetarian', 'dairy'],
        ingredients: [
            { name: 'בצק עלים', amount: 1, unit: 'units' },
            { name: 'גבינה בולגרית', amount: 250, unit: 'grams' },
            { name: 'גבינה צהובה', amount: 100, unit: 'grams' },
            { name: 'ביצים', amount: 1, unit: 'units' },
            { name: 'שומשום', amount: 1, unit: 'units' }
        ],
        instructions: [
            'מערבבים את הגבינות למילוי אחיד.',
            'פורסים את הבצק וחותכים לריבועים או משולשים.',
            'מניחים כף מילוי בכל יחידה וסוגרים היטב.',
            'מורחים ביצה, מפזרים שומשום ואופים עד להזהבה יפה.'
        ]
    },
    {
        name: 'חריימה דג מסורתי',
        emoji: '🐟',
        image: 'https://images.unsplash.com/photo-1534948665823-7643f82fe35e?auto=format&fit=crop&w=600&q=80',
        time: '30 דק',
        difficulty: 'בינוני',
        tags: ['dinner', 'healthy', 'israeli'],
        ingredients: [
            { name: 'דג (בורי/אמנון)', amount: 4, unit: 'slices' },
            { name: 'רסק עגבניות', amount: 2, unit: 'units' },
            { name: 'שום', amount: 6, unit: 'units' },
            { name: 'פפריקה חריפה', amount: 1, unit: 'units' },
            { name: 'כמון', amount: 1, unit: 'units' }
        ],
        instructions: [
            'מטגנים שום קצוץ בשפע שמן, מוסיפים פפריקה ופותחים את הטעמים.',
            'מוסיפים רסק עגבניות ומים ליצירת רוטב עשיר.',
            'מביאים לרתיחה ומבשלים 10 דקות.',
            'מניחים את פרוסות הדג ברוטב ומבשלים עוד 15 דקות.'
        ]
    },
    {
        name: 'שקשוקה ירוקה',
        emoji: '🍳',
        image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&q=80',
        time: '20 דק',
        difficulty: 'בינוני',
        tags: ['breakfast', 'vegetarian', 'healthy'],
        ingredients: [
            { name: 'ביצים', amount: 4, unit: 'units' },
            { name: 'תרד', amount: 300, unit: 'grams' },
            { name: 'שמנת לבישול', amount: 125, unit: 'ml' },
            { name: 'בצל ירוק', amount: 3, unit: 'units' },
            { name: 'גבינת פטה', amount: 50, unit: 'grams' }
        ],
        instructions: [
            'מאדים תרד ובצל ירוק במחבת עם מעט חמאה.',
            'מוסיפים שמנת ומביאים לבעבוע קל.',
            'שוברים פנימה את הביצים ומפזרים מעל פטה.',
            'מבשלים עד למידת העשייה הרצויה של הביצים.'
        ]
    },
    {
        name: 'סלט פטוש רענן',
        emoji: '🥗',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
        time: '15 דק',
        difficulty: 'קל',
        tags: ['salad', 'vegan', 'healthy'],
        ingredients: [
            { name: 'עגבניות', amount: 2, unit: 'units' },
            { name: 'מלפפונים', amount: 2, unit: 'units' },
            { name: 'פיתה קלויה', amount: 1, unit: 'units' },
            { name: 'צנונית', amount: 4, unit: 'units' },
            { name: 'סומאק', amount: 1, unit: 'units' }
        ],
        instructions: [
            'חותכים את כל הירקות לקוביות גסות.',
            'שוברים את הפיתה הקלויה לחתיכות קטנות.',
            'מערבבים יחד ומתבלים בשמן זית, לימון והרבה סומאק.',
            'מומלץ להגיש עם פטרוזיליה ונענע קצוצה.'
        ]
    },
    {
        name: 'עראייס בתנור',
        emoji: '🥙',
        image: 'https://images.unsplash.com/photo-1529006557870-1748297add3a?auto=format&fit=crop&w=600&q=80',
        time: '25 דק',
        difficulty: 'קל',
        tags: ['dinner', 'meat', 'israeli'],
        ingredients: [
            { name: 'בשר טחון', amount: 500, unit: 'grams' },
            { name: 'פיתה', amount: 4, unit: 'units' },
            { name: 'בצל', amount: 1, unit: 'units' },
            { name: 'פטרוזיליה', amount: 1, unit: 'units' },
            { name: 'שמן זית', amount: 1, unit: 'units' }
        ],
        instructions: [
            'מערבבים בשר עם בצל קצוץ, פטרוזיליה ותבלינים.',
            'חוצים פיתות וממלאים כל חצי בתערובת הבשר.',
            'מושחים את הפיתות בשמן זית בנדיבות.',
            'צולים בתנור חם מאוד כ-10 דקות מכל צד עד לפריכות.'
        ]
    },
    {
        name: 'סביח בצלחת',
        emoji: '🍆',
        image: 'https://images.unsplash.com/photo-1541518763669-27fef0c99444?auto=format&fit=crop&w=600&q=80',
        time: '30 דק',
        difficulty: 'בינוני',
        tags: ['lunch', 'vegetarian', 'israeli'],
        ingredients: [
            { name: 'חצילים', amount: 1, unit: 'units' },
            { name: 'ביצים קשות', amount: 2, unit: 'units' },
            { name: 'תפוחי אדמה מבושלים', amount: 1, unit: 'units' },
            { name: 'טחינה', amount: 0.5, unit: 'cups' },
            { name: 'עמבה', amount: 1, unit: 'units' }
        ],
        instructions: [
            'מטגנים פרוסות חציל עד להזהבה עמוקה.',
            'מסדרים בצלחת: חצילים, פרוסות תפו"א ופרוסות ביצה.',
            'שופכים מעל טחינה בנדיבות ומעט עמבה.',
            'מפזרים פטרוזיליה ומגישים עם פיתה חמה.'
        ]
    },
    {
        name: 'לביבות תפוחי אדמה',
        emoji: '🥔',
        image: 'https://images.unsplash.com/photo-1599321955419-7801363a0337?auto=format&fit=crop&w=600&q=80',
        time: '25 דק',
        difficulty: 'קל',
        tags: ['side', 'vegetarian', 'israeli'],
        ingredients: [
            { name: 'תפוחי אדמה', amount: 3, unit: 'units' },
            { name: 'ביצים', amount: 2, unit: 'units' },
            { name: 'בצל', amount: 1, unit: 'units' },
            { name: 'קמח', amount: 2, unit: 'units' }
        ],
        instructions: [
            'מגרדים את תפוחי האדמה והבצל וסוחטים היטב מהנוזלים.',
            'מערבבים עם ביצים, קמח מלח ופלפל.',
            'יוצרים לביבות ומטגנים במחבת עד להזהבה.',
            'מגישים עם שמנת חמוצה או רסק עגבניות.'
        ]
    },
    {
        name: 'מטבוחה מבושלת',
        emoji: '🍅',
        image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?auto=format&fit=crop&w=600&q=80',
        time: '120 דק',
        difficulty: 'קשה',
        tags: ['side', 'vegan', 'healthy', 'israeli'],
        ingredients: [
            { name: 'עגבניות', amount: 10, unit: 'units' },
            { name: 'פלפל חריף ירוק', amount: 2, unit: 'units' },
            { name: 'שום', amount: 8, unit: 'units' },
            { name: 'שמן', amount: 0.5, unit: 'cups' }
        ],
        instructions: [
            'קולפים עגבניות וחותכים לקוביות.',
            'מבשלים בסיר רחב עם שמן ושום על אש קטנה מאוד.',
            'מבשלים שעות ארוכות עד שכל הנוזלים מתאדים ונשארת ריבה אדומה.',
            'מתבלים בפפריקה ומעט מלח.'
        ]
    },
    {
        name: 'מלבי חלבי מפנק',
        emoji: '🍧',
        image: 'https://images.unsplash.com/photo-1579954115545-a95591f28be0?auto=format&fit=crop&w=600&q=80',
        time: '15 דק',
        difficulty: 'קל',
        tags: ['dessert', 'dairy', 'israeli'],
        ingredients: [
            { name: 'חלב', amount: 1, unit: 'lite' },
            { name: 'קורנפלור', amount: 80, unit: 'grams' },
            { name: 'סוכר', amount: 0.5, unit: 'cups' },
            { name: 'סירופ ורדים', amount: 1, unit: 'units' }
        ],
        instructions: [
            'מרתיחים חלב עם סוכר (משאירים כוס חלב בצד להמסת הקורנפלור).',
            'מערבבים קורנפלור עם יתרת החלב ושופכים פנימה תוך ערבוב מתמיד.',
            'מבשלים עד שמסמיך ומעבירים לכוסות הגשה.',
            'מקררים לפחות 4 שעות ומגישים עם סירופ ורדים וקוקוס.'
        ]
    },
    {
        name: 'חלה לשבת',
        emoji: '🍞',
        image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=600&q=80',
        time: '120 דק',
        difficulty: 'קשה',
        tags: ['side', 'vegetarian', 'israeli'],
        ingredients: [
            { name: 'קמח', amount: 1, unit: 'kg' },
            { name: 'שמרים יבשים', amount: 2, unit: 'units' },
            { name: 'סוכר', amount: 0.5, unit: 'cups' },
            { name: 'מים', amount: 2.5, unit: 'cups' }
        ],
        instructions: [
            'לשים את כל חומרי הבצק עד לקבלת בצק חלק וגמיש.',
            'מתפיחים כשעה וחצי עד להכפלת הנפח.',
            'קולעים צמות מרהיבות ומסדרים בתבנית.',
            'מתפיחים שוב, מורחים ביצה ואופים עד להשחמה מרהיבה.'
        ]
    },
    {
        name: 'שווארמה ביתית',
        emoji: '🥙',
        image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80',
        time: '20 דק',
        difficulty: 'קל',
        tags: ['lunch', 'meat', 'israeli'],
        ingredients: [
            { name: 'בשר הודו נקבה', amount: 500, unit: 'grams' },
            { name: 'בצל', amount: 2, unit: 'units' },
            { name: 'שומן כבש', amount: 50, unit: 'grams' },
            { name: 'תבלין שווארמה', amount: 1, unit: 'units' }
        ],
        instructions: [
            'פורסים את הבשר והשומן לרצועות דקיקות.',
            'מטגנים בצל עד להזהבה ומוסיפים את הבשר והתבלינים.',
            'צולים על אש גבוהה מאוד עד שהבשר מוכן ושחום.',
            'מגישים בתוך פיתה או לאפה עם הרבה טחינה.'
        ]
    }
];

async function main() {
    console.log('Inserting expanded recipes...');
    for (const r of recipes) {
        await prisma.recipe.create({
            data: {
                name: r.name,
                emoji: r.emoji,
                image: r.image,
                time: r.time,
                difficulty: r.difficulty,
                tags: JSON.stringify(r.tags),
                ingredients: JSON.stringify(r.ingredients),
                instructions: JSON.stringify(r.instructions),
                isPrivate: false,
                servings: 4
            }
        });
    }
    console.log(`✅ Success! Inserted ${recipes.length} new recipes.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
