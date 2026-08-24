const Google = (() => {

    const WEB_APP_URL =
        "https://script.google.com/macros/s/AKfycbx4-HjEmg2jtAutGAZCEF_1Go-qqWGPbM27Kc8otyM0xqFU1wZNUYdPiaR9Q_l0f-SHIQ/exec";

    const REQUEST_TIMEOUT = 30000; // 15 seconds


    async function appendRow(
        spreadsheetId,
        sheetName,
        row,
        orderId
    ) {

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, REQUEST_TIMEOUT);


        try {

            const response = await fetch(
                WEB_APP_URL,
                {
                    method: "POST",

                    headers: {
    "Content-Type": "text/plain;charset=utf-8"
},

                    body: JSON.stringify({

                        spreadsheetId,

                        sheetName,

                        row,

                        orderId

                    }),

                    signal: controller.signal
                }
            );


            if (!response.ok) {

                throw new Error(
                    `Google HTTP ${response.status}`
                );

            }


            return await response.json();


        } catch (error) {

            if (error.name === "AbortError") {

                throw new Error(
                    `Google request timeout after ${REQUEST_TIMEOUT / 1000} seconds`
                );

            }

            throw error;

        } finally {

            clearTimeout(timeout);

        }

    }


    return {

        appendRow

    };

})();