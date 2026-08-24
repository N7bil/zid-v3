const Parser = (() => {

    // ======================================================
    // BUILD FULL SHIPPING ADDRESS
    // ======================================================

    function buildFullAddress(address) {

        if (!address || typeof address !== "object") {
            return "";
        }

        const parts = [];
        const usedValues = new Set();

        function addPart(value) {

            if (
                value === null ||
                value === undefined
            ) {
                return;
            }

            const text = String(value).trim();

            if (
                !text ||
                text === "N/A" ||
                text === "null" ||
                text === "undefined"
            ) {
                return;
            }

            if (usedValues.has(text)) {
                return;
            }

            usedValues.add(text);
            parts.push(text);
        }

        // ==================================================
        // ZID ADDRESS ORDER
        //
        // 1 - المنطقة
        // 2 - district
        // 3 - street
        //
        // مثال:
        // أبرق خيطان, 6, 626
        //
        // مثال آخر:
        // عبدالله المبارك الصباح,
        // شارع 124 - منزل 59,
        // قطعه 1
        // ==================================================

        addPart(
            address.city?.name
        );

        addPart(
            address.district
        );

        addPart(
            address.street
        );

        // ==================================================
        // ADDITIONAL ADDRESS DATA
        // ==================================================

        const meta = address.meta;

        if (
            meta &&
            typeof meta === "object"
        ) {

            addPart(
                meta.building_number
            );

            addPart(
                meta.additional_number
            );

            addPart(
                meta.postcode
            );

            // لا نضيف:
            // city_name
            // لأنه غالبًا تكرار للمنطقة
        }

        return parts.join(", ");
    }


    // ======================================================
    // PARSE ORDER
    // ======================================================

    function parseOrder(order) {

        console.log("===== PRICE DEBUG =====");

        console.log(
            "ORDER ID:",
            order.id
        );

        console.log(
            "TRANSACTION AMOUNT:",
            order.transaction_amount
        );

        console.log(
            "CURRENCY CODE:",
            order.currency_code
        );

        console.log("======================");

        const shippingAddress =
            order.shipping?.address || {};

        console.log(
            "===== ZID ADDRESS DATA ====="
        );

        console.log(
            shippingAddress
        );

        const fullAddress =
            buildFullAddress(shippingAddress);

        console.log(
            "===== FINAL ADDRESS ====="
        );

        console.log(
            fullAddress
        );

        console.log(
            "========================="
        );

        return {

            id:
                order.id,

            name:
                order.customer?.name || "",

            phone:
                order.customer?.mobile || "",

            address:
                fullAddress,

            paymentStatus:
                order.payment_status || "",

            country:
                shippingAddress.country?.name ||
                "",

            currency:
                order.currency_code || "",

            total:
                order.order_total_string || "",

            products:
                Array.isArray(order.products)
                    ? order.products.map(product => ({
                        name:
                            product.name || "",

                        quantity:
                            product.quantity || 0
                    }))
                    : []

        };
    }


    return {
        parseOrder
    };

})();