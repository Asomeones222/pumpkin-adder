const PA_AppState = {
    Initial: "Initial",
    Searching: "Searching",
    Registeration: "Registeration",
    FreeTime: "FreeTime",
}

class PA_classFactory {
    /**
     * @param {string | null} name
     * @param {string} ID
     * @param {string} sections
     * @param {boolean} isRegistered
     * @param {null} category
     */
    constructor(name, ID, sections, isRegistered, category) {
        this.name = name.trim();
        this.ID = ID.trim();
        this.sections = sections.trim().split(',');
        this.isRegistered = isRegistered;
        this.category = category;
    }
    toString() {
        return `${this.name} ${this.ID} ${this.sections.join(', ')}`;
    }
}
const PA_Classes = {
    state: PA_AppState["Initial"],
    running: false,
    wantedClasses: [],
    loadWantedClassesFromStorage() {
        chrome.storage.sync.get(["PA-classes"], (data) => {

            console.info("User data in storage:" + data);
            if (Object.keys(data).length === 0) return;

            data["PA-classes"].forEach(_class => {
                const wantedClass = new PA_classFactory(_class[0], _class[1], _class[2], false, null);
                this.wantedClasses.push(wantedClass);
            });
            console.info("User wanted classes: " + PA_Classes.wantedClasses);
            PA_DOM.Start();
        });
    },
    loadUserSettings() {
        chrome.storage.sync.get("PA-settings", (data) => {
            PA_Classes.degree = data["PA-settings"].degree;
            PA_Classes.faculty = data["PA-settings"].faculty;
            PA_Classes.major = data["PA-settings"].department;
            console.log("Loaded user's settings.");

        });
    },
    allAdded: false,
    degree: "",
    faculty: "",
    major: "",
    openClasses: [],
    openWantedClasses: [],
};



// ********************

const PA_DOM = {
    // DOM manipulation is done here
    sfx: new Audio(chrome.runtime.getURL("./src/sfx/sfx.wav")),

    delay: {
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
    },

    step: (n) => n * 2500,

    loadClasses() {
        // Loads available classes into schedule
        const degree = document.getElementById("form:degree");
        [...degree.children].forEach((option) => {
            if (option.textContent.includes(PA_Classes.degree)) {
                option.selected = true;
                degree.dispatchEvent(new Event("change"));
                console.log("degree selected");
            }
        });
        setTimeout(function () {
            const faculty = document.getElementById("form:Faculty");
            [...faculty.children].forEach((el) => {
                if (el.textContent.includes(PA_Classes.faculty)) {
                    el.selected = true;
                    faculty.dispatchEvent(new Event("change"));
                    console.log("Faculty selected");
                }
            });
        }, this.delay.delay());

        setTimeout(function () {
            const major = document.getElementById("form:departmentlist");
            [...major.children].forEach((el) => {
                if (el.textContent.includes(PA_Classes.major)) {
                    el.selected = true;
                    const event = new Event("change");
                    major.dispatchEvent(event);
                    console.log("Major selected");
                }
            });
        }, this.delay.delay());
    },

    storeOpenClasses() {
        // Scrapes for open classes and stores them
        const classStatusButton = document.getElementById(
            "form:ofrddatatable:j_idt103"
        ); //This button orders the classes according to their open status.
        classStatusButton.click();
        setTimeout(() => {
            // classStatusButton.style.outline = "2px solid green";
            classStatusButton.click();
            console.log("Sort by classes.");
        }, 1000); //Delay between each two presses.

        const classesTableElement = document.getElementById("form:ofrddatatable_data");
        [...classesTableElement.children].forEach((item) => {
            if ([...item.children].at(-3).textContent.includes("مفتوحة")) {
                //Check the cell where the status of the class is shown.
                const name = item.children[1].textContent;
                const ID = item.attributes
                    .getNamedItem("data-rk")
                    .value.split(" ")[0];
                const sections = item.attributes
                    .getNamedItem("data-rk")
                    .value.split(" ")[1];
                const openClass = new PA_classFactory(name, ID, sections, false, null)
                PA_Classes.openClasses.push(openClass);
            }
        });
    },

    storeOpenWantedCourses() {
        // Stores the open and wanted classes.
        // PA_Classes.wantedClasses.forEach((wantedClass) => {
        //     if (PA_Classes.openClasses.some((openClass) => openClass.ID === wantedClass.ID && wantedClass.sections.includes(openClass.sections[0])))
        //         PA_Classes.openWantedClasses.push(wantedClass);
        // });
        PA_Classes.openClasses.forEach((openClass) => {
            if (PA_Classes.wantedClasses.some((wantedClass) => openClass.ID === wantedClass.ID && wantedClass.sections.includes(
                openClass.sections[0]
            )))
                PA_Classes.openWantedClasses.push(openClass);
        });
        console.log("Open wanted classes are\n", PA_Classes.openWantedClasses);
    },

    alertWithOpenWantedCourses() {
        if (PA_Classes.openWantedClasses.length === 0) return;
        const output = [];
        PA_Classes.openWantedClasses.forEach((OWclass) => output.push(OWclass.toString()));
        new Notification(
            `The following classe(s) are open: ${output.join("\n")}`
        );
        console.info("%cNotification triggered!", "color:cyan");
        if (this.sfx.currentTime < 1)
            this.sfx.currentTime = 0;
        this.sfx.play().catch(err => {
            console.log('Error playing audio. Make sure to click on the background of the page.');
        });

    },
    removedSavedClasses() {
        // Removes classes saved in openClasses and openWantedClasses in every iteration.
        PA_Classes.openClasses = [];
        PA_Classes.openWantedClasses = [];
    },
    Start() {
        console.log(PA_Classes.state);
        PA_Classes.state = PA_AppState["Searching"];
        setInterval(() => {
            if (!PA_Classes.running) {
                PA_Classes.state = PA_AppState["Initial"];
                return;
            }
            this.loadClasses();
            setTimeout(() => {
                this.storeOpenClasses();
                console.log("Open classes are\n", PA_Classes.openClasses);
                this.storeOpenWantedCourses();
                this.alertWithOpenWantedCourses();
                this.removedSavedClasses();
            }, this.delay.delay());
            this.delay.resetDelayCount();
            console.log("Interval Called");

        }, 8 * this.delay.sleep); //8 is the number of all delay.delay() called plus 1!
    },

}

const init = function () {
    chrome.storage.sync.set({ "PA-start": false }, () => {
        console.info('Pumpkin Adder: Ready');
    });
    PA_Classes.loadUserSettings();
}
init();


const PA_intervalCheckIfToStart = setInterval(() => {
    // Checks if the user wants to start every second. Acts like a primitive "event listener".
    chrome.storage.sync.get(["PA-start"], function (data) {
        if (data["PA-start"] === true) {
            PA_Classes.loadWantedClassesFromStorage();
            clearInterval(PA_intervalCheckIfToStart);
        }
    });
}, 1000);

const PA_intervalCheckIfToContinue = setInterval(() => {
    chrome.storage.sync.get(["PA-start"], function (data) {
        if (data["PA-start"] === true) {
            PA_Classes.running = true;
        }
        else
            PA_Classes.running = false;
    });
}, 1000);

