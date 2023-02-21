const classes = {
    wantedClasses: [
        {
            name: "الذكاء الاصطناعي وتعلم الالة",
            section: [],
            ID: "0917451",
            added: false,
            type: "متطلبات التخصص الاجبارية (92) ساعة معتمدة",
        },
        {
            name: "الالكترونيات الرقمية ودوائر التكامل الكبير جداً",
            section: [],
            ID: "0917461",
            added: false,
            type: "متطلبات التخصص الاختيارية (15) ساعة معتمدة",
        },
        {
            name: "مواضيع مختارة في هندسة الحاسوب",
            section: "1",
            ID: "0907531",
            added: false,
            type: "متطلبات التخصص الاختيارية (15) ساعة معتمدة",
        },
        {
            name: "	مشاغل هندسية",
            section: [],
            ID: "0966111",
            added: false,
            type: "متطلبات التخصص الاختيارية (15) ساعة معتمدة",
        }
    ],
    allAdded: false,
    faculty: "الهندسة",
    major: "هندسة الحاسوب",
    openClasses: [],
    openWantedClasses: [],
};

const delay = {
    sleep: 1100,
    delay() {
        this.lastDelayNumber += 1;
        return this.lastDelayNumber * this.sleep;
    },
    customDelay(n) {
        n * this.sleep;
    },
    resetDelayCount() {
        this.lastDelayNumber = 0;
    },
    lastDelayNumber: 0,
};

const step = (n) => n * 2500;

const loadClasses = function () {
    const degree = document.getElementById("form:degree");
    degree.children[1].selected = true; //Select bachelor's degree
    const event = new Event("change");
    degree.dispatchEvent(event);

    setTimeout(function () {
        const faculty = document.getElementById("form:Faculty");
        [...faculty.children].forEach((el) => {
            if (el.textContent.includes(classes.faculty)) {
                el.selected = true;
                const event = new Event("change");
                faculty.dispatchEvent(event);
                console.log("Faculty selected");
            }
        });
    }, delay.delay());

    setTimeout(function () {
        const major = document.getElementById("form:departmentlist");
        [...major.children].forEach((el) => {
            if (el.textContent.includes(classes.major)) {
                el.selected = true;
                const event = new Event("change");
                major.dispatchEvent(event);
                console.log("Major selected");
            }
        });
    }, delay.delay());
};

const storeOpenClasses = function () {
    const classStatusButton = document.getElementById(
        "form:ofrddatatable:j_idt103"
    ); //This button orders the classes according to their status.
    classStatusButton.click();
    setTimeout(() => {
        classStatusButton.style.outline = "2px solid green";
        classStatusButton.click();
        console.log("Sort by open classes.");
    }, 1000); //Delay between each two presses.

    const classsTable = document.getElementById("form:ofrddatatable_data");
    [...classsTable.children].forEach((mat) => {
        if ([...mat.children].at(-3).textContent.includes("مفتوحة")) {
            //Check the cell where the status of the class is shown.
            const name = mat.children[1].textContent;
            const ID = mat.attributes
                .getNamedItem("data-rk")
                .value.split(" ")[0];
            const section = mat.attributes
                .getNamedItem("data-rk")
                .value.split(" ")[1];
            classes.openClasses.push({
                name: name,
                ID: ID,
                section: section,
            });
        }
    });
};

const logOpenWantedCourses = function () {
    classes.wantedClasses.forEach((mat) => {
        if (classes.openClasses.some((openMat) => openMat.ID === mat.ID && openMat.section === mat.section))
            classes.openWantedClasses.push(mat);
    });
    console.log("Open wanted classes are\n", classes.openWantedClasses);
};

const alertWithOpenWantedCourses = function () {
    if (classes.openWantedClasses.length === 0) return;
    const output = [];
    classes.openWantedClasses.forEach((OWmat) => output.push(OWmat.name));
    new Notification(
        `The following class(s) are open: ${output.join("\n")}`
    );
    console.info("%cNotification triggered!", "color:cyan");
    // Play programmatically generated sound
    const context = new AudioContext();
    const o = context.createOscillator();
    const g = context.createGain();
    o.connect(g);
    g.connect(context.destination);
    o.start(0);
    setTimeout(() => o.stop(), 10000);
};
const removedSavedClasses = function () {
    // Removes classes saved in openClasses and openWantedClasses in every iteration.
    classes.openClasses = [];
    classes.openWantedClasses = [];
};
const ZZStart = function () {
    loadClasses();
    setTimeout(() => {
        storeOpenClasses();
        console.log("Open classes are\n", classes.openClasses);
        logOpenWantedCourses();
        alertWithOpenWantedCourses();
        removedSavedClasses();
    }, delay.delay());
    delay.resetDelayCount();
    setInterval(function () {
        loadClasses();
        setTimeout(() => {
            storeOpenClasses();
            console.log("Open classes are\n", classes.openClasses);
            logOpenWantedCourses();
            alertWithOpenWantedCourses();
            removedSavedClasses();
        }, delay.delay());
        // loadClasses();
        // setTimeout(storeOpenClasses, delay.delay());
        // setTimeout(() => {
        //     console.log("Open classes are\n", classes.openClasses);
        // }, delay.delay());
        // setTimeout(logOpenWantedCourses, delay.delay());
        // setTimeout(alertWithOpenWantedCourses, delay.delay());
        // setTimeout(removedSavedClasses, delay.delay());
        delay.resetDelayCount();
        console.log("Interval Called");

    }, 8 * delay.sleep); //8 is the number of all delay.delay() called plus 1!
};
ZZStart();