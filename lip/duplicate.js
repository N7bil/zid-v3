const Duplicate = (() => {

    const STORAGE_KEY = "processedOrderIds";

    function getOrders() {

        try {

            const data =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!data) {
                return [];
            }

            const orders =
                JSON.parse(data);

            return Array.isArray(orders)
                ? orders
                : [];

        } catch (error) {

            console.error(
                "DUPLICATE GET ERROR:",
                error
            );

            return [];
        }
    }


    function exists(orderId) {

        const orders =
            getOrders();

        return orders.includes(
            String(orderId)
        );
    }


    function add(orderId) {

        const orders =
            getOrders();

        const id =
            String(orderId);


        if (
            orders.includes(id)
        ) {

            return false;
        }


        orders.push(id);


        /*
         * نحتفظ بآخر 500 طلب فقط
         */
        const limitedOrders =
            orders.slice(-500);


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                limitedOrders
            )
        );


        return true;
    }


    function reset() {

        localStorage.removeItem(
            STORAGE_KEY
        );

        console.log(
            "DUPLICATE STORAGE RESET"
        );
    }


    return {
        exists,
        add,
        reset
    };

})();