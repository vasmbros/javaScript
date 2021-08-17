const client = require("./mongoConnection.js");

pidNotExists = () => {
    return client
        .connect()
        .then((client) => {
            const db = client.db("package");
            return db
                .collection("users")
                .find({ pid: { $exists: false } })
                .toArray();
        })
        .then((data) => {
            console.log(data);
            return data;
        });
};
process.on("message", () => {
    pidNotExists().then((data) => {
        if (data !== null) {
            let _id = [];
            data.forEach((element, index) => {
                _id[index] = element._id;
            });

            increaseIndex = () => {
                client.connect(async() => {
                    let num = _id.length - 1;
                    console.log(process.argv[2]);
                    for (let i = num; i >= 0; i--) {
                        const db = await client.db("package");

                        db.collection("users").updateMany({ _id: _id[i] }, { $set: { pid: process.argv[2] } });
                    }
                });
            };
            increaseIndex();
        }
    });
});

updateField = () => {
    client.connect(() => {
        const db = client.db("package");
        db.collection("users").updateMany({}, { $unset: { pid: 6 } }, { multi: true });
    });
};
updateField();