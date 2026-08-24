console.log("=================================");
console.log("ZID ORDER SYNC WEBSITE");
console.log("APP.JS LOADED");
console.log("=================================");


// ======================================================
// CONFIG
// ======================================================

const EXTENSION_ID =
    "liogjkglhlgepdbibaefiblpnlbgjjhl";

const POLL_INTERVAL =
    15 * 60 * 1000; // 15 minutes

const MAX_PAGES = 20;

const REST_PRODUCTS = [
    "خلطة الراحة للجهاز الهضمي والقولون - عرض كورس خلطة الراحة للجهاز الهضمي - 3 حبات",
    "خلطة الراحة للجهاز الهضمي والقولون - حبة واحدة"
];


// ======================================================
// STATE
// ======================================================

let syncRunning = false;

let autoSyncTimer = null;

let stopRequested = false;


// ======================================================
// DOM
// ======================================================

const savedCount =
    document.getElementById("savedCount");

const duplicateCount =
    document.getElementById("duplicateCount");

const failedCount =
    document.getElementById("failedCount");

const syncErrors =
    document.getElementById("syncErrors");

const syncStatusText =
    document.getElementById("syncStatusText");

const startBtn =
    document.getElementById("startBtn");

const stopBtn =
    document.getElementById("stopBtn");

const saveBtn =
    document.getElementById("saveBtn");

const endShiftBtn =
    document.getElementById("endShiftBtn");

const resetBtn =
    document.getElementById("resetBtn");

const resetSettingsBtn =
    document.getElementById("resetSettingsBtn");


// ======================================================
// CHECK REQUIRED ELEMENTS
// ======================================================

console.log("DOM CHECK:", {
    savedCount,
    duplicateCount,
    failedCount,
    syncErrors,
    syncStatusText,
    startBtn,
    stopBtn,
    saveBtn,
    endShiftBtn,
    resetBtn,
    resetSettingsBtn
});


// ======================================================
// STORAGE HELPERS
// ======================================================

function getStorage(key, defaultValue = null) {

    try {

        const value =
            localStorage.getItem(key);

        if (value === null) {
            return defaultValue;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "Storage GET ERROR:",
            key,
            error
        );

        return defaultValue;
    }
}


function setStorage(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.error(
            "Storage SET ERROR:",
            key,
            error
        );
    }
}


function removeStorage(key) {

    try {

        localStorage.removeItem(key);

    } catch (error) {

        console.error(
            "Storage REMOVE ERROR:",
            key,
            error
        );
    }
}


// ======================================================
// SETTINGS
// ======================================================

function getSettings() {

    return {

        internalSpreadsheetId:
            document
                .getElementById("internalSpreadsheetId")
                .value
                .trim(),

        internalPaidHoneyTabName:
            document
                .getElementById("internalPaidHoneyTabName")
                .value
                .trim(),

        internalCashHoneyTabName:
            document
                .getElementById("internalCashHoneyTabName")
                .value
                .trim(),

        internalPaidRestTabName:
            document
                .getElementById("internalPaidRestTabName")
                .value
                .trim(),

        internalCashRestTabName:
            document
                .getElementById("internalCashRestTabName")
                .value
                .trim(),

        internationalSpreadsheetId:
            document
                .getElementById("internationalSpreadsheetId")
                .value
                .trim(),

        internationalTabName:
            document
                .getElementById("internationalTabName")
                .value
                .trim(),

        lastProcessedOrderId:
            document
                .getElementById("lastOrderId")
                .value
                .trim()
    };
}


function saveSettings(settings) {

    setStorage(
        "zidSettings",
        settings
    );

    console.log(
        "SETTINGS SAVED:",
        settings
    );
}


function loadSettings() {

    const settings =
        getStorage(
            "zidSettings",
            {}
        );


    document.getElementById(
        "internalSpreadsheetId"
    ).value =
        settings.internalSpreadsheetId || "";


    document.getElementById(
        "internalPaidHoneyTabName"
    ).value =
        settings.internalPaidHoneyTabName || "";


    document.getElementById(
        "internalCashHoneyTabName"
    ).value =
        settings.internalCashHoneyTabName || "";


    document.getElementById(
        "internalPaidRestTabName"
    ).value =
        settings.internalPaidRestTabName || "";


    document.getElementById(
        "internalCashRestTabName"
    ).value =
        settings.internalCashRestTabName || "";


    document.getElementById(
        "internationalSpreadsheetId"
    ).value =
        settings.internationalSpreadsheetId || "";


    document.getElementById(
        "internationalTabName"
    ).value =
        settings.internationalTabName || "";


    document.getElementById(
        "lastOrderId"
    ).value =
        settings.lastProcessedOrderId || "";


    console.log(
        "SETTINGS LOADED:",
        settings
    );
}


// ======================================================
// STATS
// ======================================================

function getStats() {

    return getStorage(
        "syncStats",
        {
            saved: 0,
            duplicate: 0,
            failed: 0,
            errors: [],
            status: "Ready"
        }
    );
}


function saveStats(stats) {

    setStorage(
        "syncStats",
        stats
    );

    renderStats(stats);
}


function resetStats() {

    const stats = {

        saved: 0,

        duplicate: 0,

        failed: 0,

        errors: [],

        status: "Ready"
    };

    saveStats(stats);
}


function updateStats(
    type,
    errorData = null
) {

    const stats =
        getStats();


    if (type === "saved") {

        stats.saved++;
    }


    if (type === "duplicate") {

        stats.duplicate++;

        if (errorData) {

            stats.errors.push({

                type: "duplicate",

                orderId:
                    String(
                        errorData.orderId
                    ),

                message:
                    `Duplicate Order ID: ${errorData.orderId}`
            });
        }
    }


    if (type === "failed") {

        stats.failed++;

        if (errorData) {

            stats.errors.push({

                type: "failed",

                orderId:
                    String(
                        errorData.orderId
                    ),

                message:
                    errorData.message ||
                    "Unknown error"
            });
        }
    }


    if (
        stats.errors.length > 50
    ) {

        stats.errors =
            stats.errors.slice(-50);
    }


    saveStats(stats);
}


function setStatus(status) {

    const stats =
        getStats();

    stats.status =
        status;

    saveStats(stats);

    console.log(
        "SYNC STATUS:",
        status
    );
}


function renderStats(stats) {

    savedCount.textContent =
        stats?.saved || 0;

    duplicateCount.textContent =
        stats?.duplicate || 0;

    failedCount.textContent =
        stats?.failed || 0;


    syncStatusText.textContent =
        stats?.status || "Ready";


    syncErrors.innerHTML =
        "";


    if (
        stats?.errors &&
        stats.errors.length > 0
    ) {

        stats.errors.forEach(
            error => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "sync-error-item";

                div.textContent =
                    `Order ${error.orderId}: ${error.message}`;

                syncErrors.appendChild(
                    div
                );
            }
        );
    }
}


// ======================================================
// LAST PROCESSED ORDER
// ======================================================

function getLastProcessedOrderId() {

    const settings =
        getSettings();

    return String(
        settings.lastProcessedOrderId || ""
    ).trim();
}


function updateLastProcessedOrderId(
    orderId
) {

    const id =
        String(orderId);

    document.getElementById(
        "lastOrderId"
    ).value = id;


    const settings =
        getSettings();

    settings.lastProcessedOrderId =
        id;


    saveSettings(settings);


    console.log(
        "LAST PROCESSED ORDER UPDATED:",
        id
    );
}


// ======================================================
// BRIDGE
// ======================================================

function bridgeRequest(message) {

    return new Promise(
        (resolve, reject) => {

            console.log(
                "BRIDGE REQUEST:",
                message
            );


            chrome.runtime.sendMessage(
                EXTENSION_ID,
                message,
                response => {

                    if (
                        chrome.runtime.lastError
                    ) {

                        reject(
                            new Error(
                                chrome.runtime.lastError.message
                            )
                        );

                        return;
                    }


                    if (
                        !response
                    ) {

                        reject(
                            new Error(
                                "No response from Bridge"
                            )
                        );

                        return;
                    }


                    if (
                        !response.success
                    ) {

                        reject(
                            new Error(
                                response.error ||
                                "Bridge request failed"
                            )
                        );

                        return;
                    }


                    resolve(
                        response
                    );
                }
            );
        }
    );
}


// ======================================================
// GET ORDERS FROM BRIDGE
// ======================================================

async function getOrders() {

    const response =
        await bridgeRequest({
            action: "getOrders"
        });


    return response.orders || [];
}


// ======================================================
// GET ORDER DETAILS FROM BRIDGE
// ======================================================

async function getOrder(
    orderId
) {

    const response =
        await bridgeRequest({

            action: "getOrder",

            orderId:
                orderId
        });


    return response.order;
}


// ======================================================
// KUWAIT
// ======================================================

function isKuwaitOrder(
    order
) {

    const phone =
        String(
            order.phone || ""
        )
        .replace(/\D/g, "");


    const currency =
        String(
            order.currency || ""
        )
        .toUpperCase();


    return (
        phone.startsWith("965") &&
        currency === "KWD"
    );
}


// ======================================================
// REST
// ======================================================

function isRestOrder(
    order
) {

    const products =
        Array.isArray(
            order.products
        )
            ? order.products
            : [];


    return products.some(
        product =>
            REST_PRODUCTS.includes(
                String(
                    product.name || ""
                ).trim()
            )
    );
}


// ======================================================
// PAID
// ======================================================

function isPaidOrder(
    order
) {

    return (
        String(
            order.paymentStatus || ""
        )
        .toLowerCase() === "paid"
    );
}


// ======================================================
// GOOGLE DESTINATION
// ======================================================

function getGoogleDestination(
    order,
    settings
) {

    let spreadsheetId;

    let tabName;


    // ==================================================
    // INTERNATIONAL
    // ==================================================

    if (
        !isKuwaitOrder(order)
    ) {

        spreadsheetId =
            settings
                .internationalSpreadsheetId;

        tabName =
            settings
                .internationalTabName;

    }

    // ==================================================
    // KUWAIT
    // ==================================================

    else {

        spreadsheetId =
            settings
                .internalSpreadsheetId;


        // REST
        if (
            isRestOrder(order)
        ) {

            if (
                isPaidOrder(order)
            ) {

                tabName =
                    settings
                        .internalPaidRestTabName;

            } else {

                tabName =
                    settings
                        .internalCashRestTabName;
            }

        }

        // HONEY
        else {

            if (
                isPaidOrder(order)
            ) {

                tabName =
                    settings
                        .internalPaidHoneyTabName;

            } else {

                tabName =
                    settings
                        .internalCashHoneyTabName;
            }
        }
    }


    return {

        spreadsheetId:
            spreadsheetId,

        tabName:
            tabName
    };
}


// ======================================================
// PROCESS SINGLE ORDER
// ======================================================

async function processOrder(
    order,
    settings
) {

    console.log(
        "================================="
    );

    console.log(
        "PROCESSING ORDER:",
        order.id
    );


    setStatus(
        `Processing order ${order.id}`
    );


    // ==================================================
    // GET DETAILS
    // ==================================================

    const details =
        await getOrder(order.id);


    if (!details) {

        throw new Error(
            "Order details are empty"
        );
    }


    console.log(
        "ORDER DETAILS:",
        details
    );


    // ==================================================
    // PARSE
    // ==================================================

    const parsed =
        Parser.parseOrder(
            details
        );


    console.log(
        "PARSED ORDER:",
        parsed
    );

    // ==================================================
// DUPLICATE CHECK
// ==================================================

if (
    Duplicate.exists(parsed.id)
) {

    console.log(
        "DUPLICATE ORDER:",
        parsed.id
    );


    updateStats(
        "duplicate",
        {
            orderId:
                parsed.id
        }
    );


    updateLastProcessedOrderId(
        parsed.id
    );


    return {
        success: true,
        duplicate: true
    };
}
    // ==================================================
    // BUILD ROW
    // ==================================================

    const row =
        Rules.buildRow(
            parsed
        );


    console.log(
        "FINAL GOOGLE ROW:",
        row
    );


    // ==================================================
    // DESTINATION
    // ==================================================

    const destination =
        getGoogleDestination(
            parsed,
            settings
        );


    console.log(
        "GOOGLE DESTINATION:",
        destination
    );


    if (
        !destination.spreadsheetId ||
        !destination.tabName
    ) {

        throw new Error(
            "Missing Spreadsheet or Tab"
        );
    }


    // ==================================================
    // GOOGLE
    // ==================================================

    const googleResult =
        await Google.appendRow(

            destination.spreadsheetId,

            destination.tabName,

            row,

            parsed.id
        );


    console.log(
        "GOOGLE RESULT:",
        googleResult
    );


    if (
        !googleResult
    ) {

        throw new Error(
            "No response from Google"
        );
    }


    // ==================================================
    // DUPLICATE
    // ==================================================

    if (
    googleResult.success === true
) {

    Duplicate.add(
        parsed.id
    );


    updateStats(
        "saved"
    );


    updateLastProcessedOrderId(
        parsed.id
    );


    console.log(
        "SAVED:",
        parsed.id
    );


    return {
        success: true,
        duplicate: false
    };
}

    // ==================================================
    // SAVED
    // ==================================================

    if (
        googleResult.success === true
    ) {

        updateStats(
            "saved"
        );


        updateLastProcessedOrderId(
            parsed.id
        );


        console.log(
            "SAVED:",
            parsed.id
        );


        return {
            success: true,
            duplicate: false
        };
    }


    // ==================================================
    // GOOGLE FAILURE
    // ==================================================

    throw new Error(
        googleResult.error ||
        "Google Sheets failed"
    );
}


// ======================================================
// MAIN SYNC
// ======================================================

async function startSync(
    lastOrderId
) {

    if (syncRunning) {

        console.log(
            "SYNC ALREADY RUNNING"
        );

        return;
    }


    syncRunning = true;

    stopRequested = false;


    console.log(
        "================================="
    );

    console.log(
        "SYNC STARTED FROM:",
        lastOrderId
    );

    console.log(
        "================================="
    );


    try {

        const settings =
            getSettings();


        const startAfterId =
            String(
                lastOrderId
            ).trim();


        if (!startAfterId) {

            throw new Error(
                "Last Order ID is required"
            );
        }


        let page = 1;

        let reachedStartId = false;

        let foundStartId = false;


        // ==================================================
        // PAGES
        // ==================================================

        while (

            !reachedStartId &&

            page <= MAX_PAGES

        ) {


            if (
                stopRequested
            ) {

                setStatus(
                    "Stopped"
                );

                break;
            }


            console.log(
                "GETTING ORDERS PAGE:",
                page
            );


            setStatus(
                `Getting orders... Page ${page}`
            );


            const orders =
                await getOrders();


            /*
             * Bridge currently returns page 1.
             *
             * The old extension requested pages directly.
             * For the website version we currently use
             * the Bridge result.
             */

            console.log(
                "ORDERS COUNT:",
                orders.length
            );


            if (
                orders.length === 0
            ) {

                console.log(
                    "NO MORE ORDERS"
                );

                break;
            }


            // ==================================================
            // PROCESS ORDERS
            // ==================================================

            for (
                const order of orders
            ) {

                if (
                    stopRequested
                ) {

                    reachedStartId =
                        true;

                    break;
                }


                console.log(
                    "CHECK ORDER:",
                    order.id
                );


                // ==================================================
                // START ID REACHED
                // ==================================================

                if (
                    String(order.id) ===
                    startAfterId
                ) {

                    console.log(
                        "START ID REACHED:",
                        order.id
                    );


                    foundStartId =
                        true;

                    reachedStartId =
                        true;

                    break;
                }


                // ==================================================
                // PROCESS
                // ==================================================

                try {

                    await processOrder(
                        order,
                        settings
                    );

                } catch (
                    orderError
                ) {

                    console.error(
                        "ORDER ERROR:",
                        order.id,
                        orderError
                    );


                    updateStats(
                        "failed",
                        {

                            orderId:
                                order.id,

                            message:
                                orderError.message ||
                                "Unknown error"
                        }
                    );


                    /*
                     * Important:
                     *
                     * We DO NOT update Last Order ID
                     * when the order fails.
                     */

                    continue;
                }
            }


            if (
                reachedStartId
            ) {

                break;
            }


            /*
             * Current Bridge test returns page 1.
             *
             * Do not fake pagination.
             *
             * We stop here until Bridge exposes
             * page parameter.
             */

            console.log(
                "BRIDGE CURRENTLY RETURNS PAGE 1 ONLY"
            );

            break;
        }


        // ==================================================
        // FINAL STATUS
        // ==================================================

        if (
            stopRequested
        ) {

            setStatus(
                "Stopped"
            );

        } else if (
            foundStartId
        ) {

            setStatus(
                "Finished"
            );

        } else {

            setStatus(
                `Start ID ${startAfterId} not found`
            );
        }


    } catch (
        error
    ) {

        console.error(
            "SYNC ERROR:",
            error
        );


        updateStats(
            "failed",
            {

                orderId:
                    "SYNC",

                message:
                    error.message ||
                    "Sync error"
            }
        );


        setStatus(
            "Error"
        );

    } finally {

        syncRunning =
            false;


        console.log(
            "SYNC PROCESS ENDED"
        );
    }
}


// ======================================================
// START AUTO SYNC
// ======================================================

function startAutoSync() {

    stopAutoSync();


    autoSyncTimer =
        setInterval(
            async () => {

                console.log(
                    "================================="
                );

                console.log(
                    "AUTO SYNC"
                );

                console.log(
                    "================================="
                );


                if (
                    syncRunning
                ) {

                    console.log(
                        "AUTO SYNC SKIPPED - ALREADY RUNNING"
                    );

                    return;
                }


                const lastOrderId =
                    getLastProcessedOrderId();


                if (
                    !lastOrderId
                ) {

                    console.log(
                        "AUTO SYNC SKIPPED - NO LAST ORDER ID"
                    );

                    return;
                }


                await startSync(
                    lastOrderId
                );

            },

            POLL_INTERVAL
        );


    console.log(
        "AUTO SYNC ENABLED - EVERY 15 MINUTES"
    );
}


// ======================================================
// STOP AUTO SYNC
// ======================================================

function stopAutoSync() {

    if (
        autoSyncTimer
    ) {

        clearInterval(
            autoSyncTimer
        );

        autoSyncTimer =
            null;
    }
}


// ======================================================
// START BUTTON
// ======================================================

startBtn.addEventListener(
    "click",
    async () => {

        console.log(
            "START BUTTON CLICKED"
        );


        if (
            syncRunning
        ) {

            alert(
                "Sync is already running"
            );

            return;
        }


        const lastOrderId =
            document
                .getElementById("lastOrderId")
                .value
                .trim();


        if (
            !lastOrderId
        ) {

            alert(
                "Please enter Last Order ID"
            );

            return;
        }


        // ==================================================
        // SAVE SETTINGS FIRST
        // ==================================================

        const settings =
            getSettings();


        settings.lastProcessedOrderId =
            lastOrderId;


        saveSettings(
            settings
        );


        // ==================================================
        // RESET STATS
        // ==================================================

        resetStats();


        stopRequested =
            false;


        // ==================================================
        // START
        // ==================================================

        startBtn.disabled =
            true;

        stopBtn.disabled =
            false;


        await startSync(
            lastOrderId
        );


        startBtn.disabled =
            false;

    }
);


// ======================================================
// STOP BUTTON
// ======================================================

stopBtn.addEventListener(
    "click",
    () => {

        console.log(
            "STOP BUTTON CLICKED"
        );


        stopRequested =
            true;


        setStatus(
            "Stopping..."
        );


        console.log(
            "STOP REQUESTED"
        );
    }
);


// ======================================================
// SAVE SETTINGS
// ======================================================

saveBtn.addEventListener(
    "click",
    () => {

        console.log(
            "SAVE SETTINGS BUTTON CLICKED"
        );


        const settings =
            getSettings();


        saveSettings(
            settings
        );


        alert(
            "Settings Saved"
        );
    }
);


// ======================================================
// END SHIFT
// ======================================================

endShiftBtn.addEventListener(
    "click",
    () => {

        console.log(
            "END SHIFT BUTTON CLICKED"
        );


        stopRequested =
            true;


        stopAutoSync();


        setStatus(
            "Stopped"
        );


        alert(
            "Shift Ended - Sync is OFF"
        );
    }
);


// ======================================================
// RESET ORDERS
// ======================================================

resetBtn.addEventListener(
    "click",
    () => {

        console.log(
            "RESET ORDERS"
        );


        stopRequested =
            true;


        resetStats();


        /*
         * We intentionally DO NOT remove
         * settings.
         */

        const settings =
            getSettings();


        settings.lastProcessedOrderId =
            "";


        saveSettings(
            settings
        );


        document.getElementById(
            "lastOrderId"
        ).value =
            "";


        setStatus(
            "Ready"
        );


        alert(
            "Stored Order State Reset"
        );
    }
);


// ======================================================
// RESET SETTINGS
// ======================================================

resetSettingsBtn.addEventListener(
    "click",
    () => {

        console.log(
            "RESET SETTINGS"
        );


        stopRequested =
            true;


        stopAutoSync();


        removeStorage(
            "zidSettings"
        );


        resetStats();


        document.getElementById(
            "internalSpreadsheetId"
        ).value = "";


        document.getElementById(
            "internalPaidHoneyTabName"
        ).value = "";


        document.getElementById(
            "internalCashHoneyTabName"
        ).value = "";


        document.getElementById(
            "internalPaidRestTabName"
        ).value = "";


        document.getElementById(
            "internalCashRestTabName"
        ).value = "";


        document.getElementById(
            "internationalSpreadsheetId"
        ).value = "";


        document.getElementById(
            "internationalTabName"
        ).value = "";


        document.getElementById(
            "lastOrderId"
        ).value = "";


        setStatus(
            "Ready"
        );


        alert(
            "Settings Reset"
        );
    }
);


// ======================================================
// INITIALIZE
// ======================================================

function initialize() {

    console.log(
        "INITIALIZING ZID ORDER SYNC"
    );


    loadSettings();


    const stats =
        getStats();


    renderStats(
        stats
    );


    stopBtn.disabled =
        true;


    /*
     * Auto Sync will only start if
     * the user has previously saved
     * a Last Order ID and the website
     * is still active.
     *
     * For now we DON'T automatically
     * start it on page load.
     */

    console.log(
        "INITIALIZATION COMPLETE"
    );
}


// ======================================================
// RUN
// ======================================================

initialize();