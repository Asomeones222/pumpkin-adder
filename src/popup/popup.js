const UI = {
    DOM: {
        classesHeader: document.querySelector(".classes-header"),
        userClassesList: document.querySelector(".classes"),
        classInputForm: document.querySelector(".class-input-form"),
        addClassBtn: document.querySelector(".btn--add"),
        classPreview:
            '<li class="class-preview" data-entry-number="{Entry}"><h3 class="class-name">{Title}</h3><div class="id-section-container"><p class="class-id">{ID}</p><p class="class-sections">{Sections}</p></div><button class="class-preview-delete btn">&#10005;</button></li>',
        startBtn: document.querySelector(".start-btn"),
        siteStatus: document.querySelector(".site-status"),
        settingsBtn: document.querySelector(".settings-btn"),
        settingsForm: document.querySelector(".settings-form"),
        saveSettingsBtn: document.querySelector(".settings-save-btn"),
    },
    setupEventHandlers() {
        UI.DOM.userClassesList.addEventListener("click", (e) => {
            if (!e.target.classList.contains("class-preview-delete")) return;
            UI.removeClassPreview(e);
        });

        UI.DOM.addClassBtn.addEventListener("click", () => {
            UI.showForm();
        });
        UI.DOM.classInputForm.addEventListener("submit", (e) => {
            e.preventDefault();
            UI.generateClassPreview();
            UI.hideForm();
        });
        UI.DOM.startBtn.addEventListener("click", () => {
            App.startApp();
        });
        UI.DOM.settingsBtn.addEventListener("click", () => {
            UI.showSettings();
        });
        UI.DOM.saveSettingsBtn.addEventListener("click", (e) => {
            e.preventDefault();
            App.saveSettings();
            UI.hideSettings();
            UI.showUserClasses();
        });
    },
    displayUrlWarning() {
        UI.DOM.siteStatus.textContent = "You are not on ";
        UI.DOM.siteStatus.style.color = "red";

        UI.DOM.siteStatus.insertAdjacentHTML(
            "beforeend",
            '<a href="https://reg.ju.edu.jo" class="site-status-url">reg.ju.edu.jo</a>'
        );
        this.hideStartBtn();
    },

    hideUrlWarning() {
        UI.DOM.siteStatus.textContent = "You are on ";
        UI.DOM.siteStatus.style.color = "inherit";
        UI.DOM.siteStatus.style.display = "none";
        // this.showStartBtn();
    },
    showForm() {
        UI.DOM.classInputForm.style.display = "flex";

        this.updateUI();
        this.hideUserClasses();
        this.hideStartBtn();
    },
    hideForm() {
        UI.DOM.classInputForm.style.display = "none";

        this.updateUI();
        // this.showStartBtn();
        this.resetForm();
        this.showUserClasses();
    },
    showUserClasses() {
        UI.DOM.classesHeader.style.display = "block";
        UI.DOM.userClassesList.style.display = "block";
        UI.DOM.addClassBtn.style.display = "inline-block";
    },
    hideUserClasses() {
        UI.DOM.classesHeader.style.display = "none";
        UI.DOM.userClassesList.style.display = "none";
        UI.DOM.addClassBtn.style.display = "none";
    },
    showStartBtn() {
        if (App.siteStatus === false) {
            this.hideStartBtn();
            return;
        }
        UI.DOM.startBtn.style.display = "inline-block";
    },
    hideStartBtn() {
        UI.DOM.startBtn.style.display = "none";
    },
    showSettings() {
        UI.DOM.settingsForm.style.display = "block";
        this.hideForm();
        this.hideUserClasses();
        this.hideStartBtn();
    },
    loadSettingsIntoUI() {
        App.loadSettings().then(() => {
            // Loads settings into UI
            const degrees = Array.from(
                UI.DOM.settingsForm.querySelector("#degree").children
            );
            degrees.forEach((option) => {
                if (option.textContent === App.settings.degree)
                    option.selected = true;
            });
            const faculties = Array.from(
                UI.DOM.settingsForm.querySelector("#faculty").children
            );
            faculties.forEach((option) => {
                if (option.textContent === App.settings.faculty)
                    option.selected = true;
            });
            const department = UI.DOM.settingsForm.querySelector("#department");
            department.value = App.settings.department;
            console.log("Settings loaded into UI");
        });
    },
    hideSettings() {
        UI.DOM.settingsForm.style.display = "none";
        this.showUserClasses();
        this.showStartBtn();
    },
    resetForm() {
        UI.DOM.classInputForm.querySelector("#class-name").value = "";
        UI.DOM.classInputForm.querySelector("#class-id").value = "";
        UI.DOM.classInputForm.querySelector("#class-sections").value = "";
    },

    generateClassPreview(
        _className = "",
        _classID = "",
        _classSections = "",
        _entry = "",
        store = true
    ) {
        const className =
            _className ||
            UI.DOM.classInputForm.querySelector("#class-name").value;
        const classID =
            _classID || UI.DOM.classInputForm.querySelector("#class-id").value;
        const classSections =
            _classSections ||
            UI.DOM.classInputForm.querySelector("#class-sections").value;
        const entry = _entry || UI.DOM.userClassesList.children.length;

        let preview = UI.DOM.classPreview
            .replace("{Title}", className)
            .replace("{ID}", classID)
            .replace("{Sections}", `${classSections}`)
            .replace("{Entry}", entry);

        UI.DOM.userClassesList.insertAdjacentHTML("beforeend", preview);

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
        document
            .querySelectorAll(".class-preview-delete")
            .forEach((btn) => (btn.style.visibility = "hidden"));
        UI.DOM.addClassBtn.style.visibility = "hidden";
    },
    showClassPreviewDeleteAddBtn() {
        document
            .querySelectorAll(".class-preview-delete")
            .forEach((btn) => (btn.style.visibility = "visible"));
        UI.DOM.addClassBtn.style.visibility = "visible";
    },
    updateUI() {
        if (App.siteStatus) {
            this.hideUrlWarning();
        } else this.displayUrlWarning();

        if (
            App.siteStatus === false ||
            App.storedClasses["PA-classes"].length === 0
        )
            this.hideStartBtn();
        else this.showStartBtn();
    },
};
const App = {
    storedClasses: { "PA-classes": [] },
    siteStatus: false,
    running: false,
    settings: {
        degree: "",
        faculty: "",
        department: "",
    },
    _setStorage(key, value, callback = () => { }) {
        // using local api instead
        let data = {};
        data[key] = value;

        chrome.storage.local.set(data)
    },
    _getStorage(key, callback = () => { }) {
        // using local api instead
        chrome.storage.local.get(key, (data) => {
            if (chrome.runtime.lastError)
                console.log('Error getting from storage!');
            console.log("Data retreived from storage");
            callback(data);
        });
    },
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
        App._getStorage("PA-classes", (data) => {
            if (Object.keys(data).length === 0)
                return;
            this.storedClasses = data;

            console.log(this.storedClasses);
            console.log("Classes imported from storage successfully");
            callback();
        });
    },

    exportClassesToStorage() {
        App._setStorage("PA-classes", this.storedClasses["PA-classes"], () => {
            console.log("Classes exported to storage successfully");
        }
        );
    },
    startApp() {
        if (!this.running) {
            this.running = true;
            // window.localStorage.setItem("PA-start", "true");
            App._setStorage("PA-start", true).then(() => {
                console.log("App started");
            });
            UI.DOM.startBtn.textContent = "Pause";
            UI.hideClassPreviewDeleteAddBtn();
        } else {
            this.pauseApp();
        }
    },
    pauseApp() {
        this.running = false;
        // window.localStorage.setItem("PA-start", "true");
        App._setStorage("PA-start", false, () => {
            console.log("App paused");
        });
        UI.DOM.startBtn.textContent = "Start";
        UI.showClassPreviewDeleteAddBtn();
    },
    setRunningState() {
        App._getStorage("PA-start", (data) => {
            if (data["PA-start"] === true) this.startApp();
            else this.pauseApp();
        });
    },
    saveSettings() {
        const degrees = Array.from(
            UI.DOM.settingsForm.querySelector("#degree").children
        );
        degrees.forEach((option) => {
            if (option.selected) App.settings.degree = option.textContent;
        });
        const faculties = Array.from(
            UI.DOM.settingsForm.querySelector("#faculty").children
        );
        faculties.forEach((option) => {
            if (option.selected) App.settings.faculty = option.textContent;
        });
        const department =
            UI.DOM.settingsForm.querySelector("#department").value;
        App.settings.department = department;

        App._setStorage("PA-settings", App.settings);
    },
    loadSettings() {
        return new Promise((resolved, rejected) => {
            App._getStorage("PA-settings", (data) => {
                App.settings.degree = data["PA-settings"]?.degree;
                App.settings.faculty = data["PA-settings"]?.faculty;
                App.settings.department = data["PA-settings"]?.department;
                resolved();
            });
        })
    },
};

const init = function () {
    // UI.DOM.classInputForm.style.display = "none";
    UI.setupEventHandlers();
    UI.hideForm();
    UI.hideSettings();
    UI.loadSettingsIntoUI();
    UI.loadClasses();
    App.checkSiteStatus();
    App.setRunningState();
};

init();
