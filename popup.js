const classesHeader = document.querySelector(".classes-header");
const userClassesList = document.querySelector(".classes");
const classInputForm = document.querySelector(".class-input-form");
const addClassBtn = document.querySelector(".btn--add");
const classPreview =
    '<li class="class-preview" data-entry-number="{Entry}"><h3 class="class-name">{Title}</h3><div class="id-section-container"><p class="class-id">{ID}</p><p class="class-sections">{Sections}</p></div><button class="class-preview-delete btn">&#10005;</button></li>';
const startBtn = document.querySelector(".start-btn");
const siteStatus = document.querySelector(".site-status");

const UI = {
    displayUrlWarning() {
        siteStatus.textContent = "You are not on ";
        siteStatus.style.color = "red";

        siteStatus.insertAdjacentHTML(
            "beforeend",
            '<a href="https://reg.ju.edu.jo" class="site-status-url">reg.ju.edu.jo</a>'
        );
        this.hideStartBtn();
    },

    hideUrlWarning() {
        siteStatus.textContent = "You are on ";
        siteStatus.style.color = "inherit";
        siteStatus.style.display = "none";
        // this.displayStartBtn();
    },
    showForm() {
        classesHeader.style.display = "none";
        classInputForm.style.display = "flex";
        userClassesList.style.display = "none";
        addClassBtn.style.display = "none";
        this.updateUI();
        this.hideStartBtn();
    },
    hideForm() {
        classInputForm.style.display = "none";
        classesHeader.style.display = "block";
        userClassesList.style.display = "block";
        addClassBtn.style.display = "inline-block";
        this.updateUI();
        // this.displayStartBtn();
        this.resetForm();
    },
    displayStartBtn() {
        if (App.siteStatus === false) {
            this.hideStartBtn();
            return;
        }
        startBtn.style.display = "inline-block";
    },
    hideStartBtn() {
        startBtn.style.display = "none";
    },
    resetForm() {
        classInputForm.querySelector("#class-name").value = "";
        classInputForm.querySelector("#class-id").value = "";
        classInputForm.querySelector("#class-sections").value = "";
    },

    generateClassPreview(
        _className = "",
        _classID = "",
        _classSections = "",
        _entry = "",
        store = true
    ) {
        const className =
            _className || classInputForm.querySelector("#class-name").value;
        const classID =
            _classID || classInputForm.querySelector("#class-id").value;
        const classSections =
            _classSections ||
            classInputForm.querySelector("#class-sections").value;
        const entry = _entry || userClassesList.children.length;

        let preview = classPreview
            .replace("{Title}", className)
            .replace("{ID}", classID)
            .replace("{Sections}", `${classSections}`)
            .replace("{Entry}", entry);

        userClassesList.insertAdjacentHTML("beforeend", preview);

        const classData = [className, classID, classSections, entry];
        if (store) {
            App.storeClass(classData);
        }
    },
    removeClassPreview(e) {
        const classToDelete = e.target.closest(".class-preview");
        App.removeClass(classToDelete);
        classToDelete.remove();
        this.updateUI();
    },
    loadClasses() {
        App.importClassesFromStorage(() => {
            Object.values(App.storedClasses)[0].forEach((el) => {
                UI.generateClassPreview(el[0], el[1], el[2], el[3], false);
                UI.updateUI();
            });
        });
    },
    hideClassPreviewDeleteAddBtn() {
        document.querySelectorAll('.class-preview-delete').forEach(btn => btn.style.visibility = 'hidden');
        addClassBtn.style.visibility = 'hidden';
    },
    showClassPreviewDeleteAddBtn() {
        document.querySelectorAll('.class-preview-delete').forEach(btn => btn.style.visibility = 'visible');
        addClassBtn.style.visibility = 'visible';

    },
    updateUI() {
        if (App.siteStatus) {
            this.hideUrlWarning();
        }
        else
            this.displayUrlWarning();

        if (
            App.siteStatus === false ||
            App.storedClasses["PA-classes"].length === 0
        )
            this.hideStartBtn();
        else
            this.displayStartBtn();
    },
};
const App = {

    storedClasses: { "PA-classes": [] },
    siteStatus: false,
    running: false,
    // getPage() {
    //     let page;
    //     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //         const currentTab = tabs[0];
    //         page = currentTab.url;
    //         console.log(page);
    //         this._checkSiteStatus(page);
    //     });
    //     return page;
    // },
    checkSiteStatus() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            const currentUrl = currentTab.url;
            this.siteStatus =
                currentUrl.includes("regapp.ju.edu.jo") ||
                currentUrl.includes("reg.ju.edu.jo");
            UI.updateUI();
        });
    },
    storeClass(classData) {
        this.storedClasses["PA-classes"].push(classData);
        this.exportClassesToStorage();
    },
    removeClass(classToDelete) {
        const classEntry = parseInt(classToDelete.dataset.entryNumber);
        const ClassesWithoutRemoved = [];
        this.storedClasses["PA-classes"].forEach((el) => {
            if (el[3] !== classEntry) ClassesWithoutRemoved.push(el);
        });
        this.storedClasses["PA-classes"] = ClassesWithoutRemoved;

        this.exportClassesToStorage();
    },
    importClassesFromStorage(callback) {
        // return JSON.parse(window.localStorage.getItem("PA-classes"));
        chrome.storage.sync.get(["PA-classes"], (data) => {
            if (Object.keys(data).length !== 0) this.storedClasses = data;

            console.log(this.storedClasses);
            console.log("Classes imported from storage successfully");
            callback();
        });
    },

    exportClassesToStorage() {
        // window.localStorage.setItem(
        //     "PA-classes",
        //     JSON.stringify(this.storedClasses)
        // );
        chrome.storage.sync.set(
            {
                "PA-classes":
                    this.storedClasses["PA-classes"],
            },
            () => {
                console.log("Classes exported to storage successfully");
            }
        );
    },
    startApp() {
        if (!this.running) {
            this.running = true;
            // window.localStorage.setItem("PA-start", "true");
            chrome.storage.sync.set({ "PA-start": true }, () => {
                console.log('App started');
            });
            startBtn.textContent = "Pause";
            UI.hideClassPreviewDeleteAddBtn();
        }
        else {
            this.pauseApp();
        }
    },
    pauseApp() {
        this.running = false;
        // window.localStorage.setItem("PA-start", "true");
        chrome.storage.sync.set({ "PA-start": false }, () => {
            console.log('App paused');
        });
        startBtn.textContent = "Start";
        UI.showClassPreviewDeleteAddBtn();
    },
    setRunningState() {
        chrome.storage.sync.get(["PA-start"], (data) => {
            if (data["PA-start"] === true)
                this.startApp();
            else
                this.pauseApp();
        });

    }

};

userClassesList.addEventListener("click", (e) => {
    if (!e.target.classList.contains("class-preview-delete")) return;
    UI.removeClassPreview(e);
});


addClassBtn.addEventListener("click", () => {
    UI.showForm();
});
classInputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    UI.generateClassPreview();
    UI.hideForm();
});
startBtn.addEventListener("click", () => {
    App.startApp();
});
const init = function () {
    // classInputForm.style.display = "none";
    UI.hideForm();
    UI.loadClasses();
    App.checkSiteStatus();
    App.setRunningState();
};

init();
