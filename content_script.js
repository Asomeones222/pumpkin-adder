const PA_App = {
    state: "Initial",
    running: false,
    wantedClasses: [],
    loadWantedClassesFromStorage() {
        PA_Utility.getStorage("PA-classes", (data) => {
            console.info("User data in storage:");
            console.log(data);
            if (Object.keys(data).length === 0) return;

            data["PA-classes"].forEach((_class) => {
                const wantedClass = new PA_class(
                    _class[0],
                    _class[1],
                    _class[2],
                    false,
                    null
                );
                this.wantedClasses.push(wantedClass);
            });
            console.info("User wanted classes: " + PA_App.wantedClasses);
        });
    },
    loadUserSettings() {
        PA_Utility.getStorage("PA-settings", (data) => {
            PA_App.degree = data["PA-settings"].degree;
            PA_App.faculty = data["PA-settings"].faculty;
            PA_App.major = data["PA-settings"].department;
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
const PA_Utility = {
    setStorage(key, value) {
        // using local api instead
        let data = {};
        data[key] = value;

        chrome.storage.local.set(data);
    },
    getStorage(key, callback = () => {}) {
        // using local api instead
        chrome.storage.local.get(key, (data) => {
            if (chrome.runtime.lastError)
                console.log("Error getting from storage!");
            // console.log(`${key}: Data retrieved from storage`);
            callback(data);
        });
    },
    modifyState(newState) {
        console.log(`Modify State: Previous state: ${PA_App.state}`);
        PA_App.state = PA_Utility.state[newState];
        console.log(`Modify State: New state: ${PA_App.state}`);
        PA_Utility.setStorage("PA-state", newState);
        return PA_Utility.state[newState];
    },
    state: {
        Initial: "Initial",
        Searching: "Searching",
        Registering: "Registering",
        FreeTime: "FreeTime",
    },
};

class PA_class {
    /**
     * @param {string} name
     * @param {string} ID
     * @param {string} sections
     * @param {boolean} isRegistered
     * @param {null} category
     */
    constructor(name, ID, sections, isRegistered, category) {
        this.name = name.trim();
        this.ID = ID.trim();
        this.sections = sections.trim().split(",");
        this.isRegistered = isRegistered;
        this.category = category;
    }
    toString() {
        return `${this.name} ${this.ID} ${this.sections.join(", ")}`;
    }
}
const PA_StateTransition = {
    registerWantedClass() {
        PA_Utility.modifyState(PA_Utility.state.Registering);
        PA_Utility.setStorage(
            "PA-classToRegister",
            PA_App.openWantedClasses[0]
        );
        window.location.assign(
            "https://regapp.ju.edu.jo/selfregapp/secured/registration.xhtml"
        );
    },
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
            if (option.textContent.includes(PA_App.degree)) {
                option.selected = true;
                degree.dispatchEvent(new Event("change"));
                console.log("degree selected");
            }
        });
        setTimeout(function () {
            const faculty = document.getElementById("form:Faculty");
            [...faculty.children].forEach((el) => {
                if (el.textContent === PA_App.faculty) {
                    el.selected = true;
                    faculty.dispatchEvent(new Event("change"));
                    console.log("Faculty selected");
                }
            });
        }, this.delay.delay());

        setTimeout(function () {
            const major = document.getElementById("form:departmentlist");
            [...major.children].forEach((el) => {
                if (el.textContent === PA_App.major) {
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

        const classesTableElement = document.getElementById(
            "form:ofrddatatable_data"
        );
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
                const openClass = new PA_class(name, ID, sections, false, null);
                PA_App.openClasses.push(openClass);
            }
        });
    },

    storeOpenWantedCourses() {
        // Stores the open and wanted classes.
        // PA_App.wantedClasses.forEach((wantedClass) => {
        //     if (PA_App.openClasses.some((openClass) => openClass.ID === wantedClass.ID && wantedClass.sections.includes(openClass.sections[0])))
        //         PA_App.openWantedClasses.push(wantedClass);
        // });
        PA_App.openClasses.forEach((openClass) => {
            if (
                PA_App.wantedClasses.some(
                    (wantedClass) =>
                        openClass.ID === wantedClass.ID &&
                        wantedClass.sections.includes(openClass.sections[0])
                )
            )
                PA_App.openWantedClasses.push(openClass);
        });
        console.log("Open wanted classes are\n", PA_App.openWantedClasses);
    },

    checkIfClassWasFound() {
        if (PA_App.openWantedClasses.length === 0) return false;

        // PA_DOM.alertWithOpenWantedCourses();
        PA_StateTransition.registerWantedClass();
    },

    alertWithOpenWantedCourses() {
        const output = [];
        if (!PA_App.openWantedClasses.length) return;
        PA_App.openWantedClasses.forEach((OWclass) =>
            output.push(OWclass.toString())
        );
        new Notification(
            `The following classe(s) are open: ${output.join("\n")}`
        );
        console.info("%cNotification triggered!", "color:cyan");
        if (this.sfx.currentTime < 1) this.sfx.currentTime = 0;
        this.sfx.play().catch((err) => {
            console.log(
                "Error playing audio. Make sure to click on the background of the page."
            );
        });
    },
    removedSavedClasses() {
        // Removes classes saved in openClasses and openWantedClasses in every iteration.
        PA_App.openClasses = [];
        PA_App.openWantedClasses = [];
    },
    Start() {
        console.log(PA_App.state);
        PA_Utility.modifyState(PA_Utility.state.Searching);
        setInterval(() => {
            if (!PA_App.running) {
                PA_Utility.modifyState(PA_Utility.state.Initial);
                return;
            }
            console.log("Interval Called");
            this.loadClasses();
            setTimeout(() => {
                this.storeOpenClasses();
                console.log("Open classes are\n", PA_App.openClasses);
                console.log("Wanted classes are\n", PA_App.wantedClasses);
                this.storeOpenWantedCourses();
                this.alertWithOpenWantedCourses();
                this.removedSavedClasses();
            }, this.delay.delay());
            this.delay.resetDelayCount();
        }, 8 * this.delay.sleep); //8 is the number of all delay.delay() called plus 1!
    },
};

const init = function () {
    PA_Utility.setStorage("PA-start", false);
    console.info("Pumpkin Adder: Ready");
    PA_App.loadUserSettings();
};
init();

const PA_intervalCheckIfToStart = setInterval(() => {
    // Polling to check if the user wants to start every second.
    PA_Utility.getStorage("PA-start", (data) => {
        if (data["PA-start"] === true) {
            PA_App.loadWantedClassesFromStorage();
            clearInterval(PA_intervalCheckIfToStart);
            PA_DOM.Start();
        }
    });
}, 1000);

const PA_intervalCheckIfToContinue = setInterval(() => {
    PA_Utility.getStorage("PA-start", (data) => {
        if (data["PA-start"] === true) {
            PA_App.running = true;
        } else PA_App.running = false;
    });
}, 1000);
