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






// ELASTIC
const clientElk = require("./controllers/elasticController");
let count = 0;

// ELASTIC INDEX
const insertIndex = "mca_company_2016";

// HELPER MODULES
const XLSX = require("xlsx");
const {mapKeys} = require("lodash");
const async = require("async");

class MainProcess {
  // INSERT DATA
  insertRegComp(data) {
    let body = data.flatMap((doc) => [{index: {_index: insertIndex}}, doc]);
    clientElk.bulkQuery(body, (res) => {
      if (res.errors) {
        console.log(
          `COMPANY NOT INSERTED IN THE DATABASE => ERROR MESSAGE: ${res}`
        );
      } else {
        console.log("COMPANY ID INSERT IN DATABASE SUCCESSFULLY");
      }
    });
    console.log(count);
  }

  // INSERT DATA FORMAT PER ELEMENT
  insertDateFormat(element, str, dateFormat, cb) {
    if (dateFormat == "mm") {
      let date = element[str];
      let timeStp = Math.floor(new Date(date).getTime() / 1000);
      element.reg_ts = timeStp;
      cb();
    } else {
      let date = element[str];
      let dateParts = date.toString().replace(/\./g, "/").split("/");
      let newDate = `${
        dateParts[1] + "/" + dateParts[0] + "/" + dateParts[2]
      } `;
      date = new Date(newDate).getTime() / 1000;
      element.reg_ts = date;
      cb();
    }
  }

  // GET TIME STAMP
  checkDateFormat(data, str, cb) {
    let month = [];
    async.eachLimit(
      data,
      1,
      (element, next) => {
        let date = element[str];
        let dateParts = date.toString().replace(/\./g, "/").split("/");

        month.push(dateParts[0]);
        next();
      },
      () => {
        month = new Set(month);
        // console.log(month.size);
        month.size == 1 ? cb("mm") : cb("dd");
      }
    );
  }

  // CHECK DIFFERENT TYPE OF DATA
  dataFormat(data) {
    let field = data[0].cin ? "cin" : data[0].fcin ? "fcin" : "llpin";
    let str = field == "llpin" ? "founded" : "date_of_registration";
    this.checkDateFormat(data, str, (dateFormat) => {
      async.eachLimit(data, 1, (element, cb) => {
        element.cid = element[field];
        this.insertDateFormat(element, str, dateFormat, () => {
          cb();
        });
      });
    });
    console.log(data[0]);
    this.insertRegComp(data);
  }

  // FETCH COMPANIES DETAILS
  CompDetail() {
    let arr = [
      "eir_January2017.numbers",
      "eir_February2017.numbers",
      "eir_March2017.numbers",
      "eir_April2017.numbers",
      "eir_May2017.numbers",
      "eir_june2017.numbers",
      "eir_july2017.numbers",
      "eir_August2017.numbers",
      "eir_September2017.numbers",
      "eir_October2017.numbers",
      "eir_November2017.numbers",
      "eir_December2017.numbers",
    ];

    for (let i = 0; i < arr.length; i++) {
      let fileName = `./2017/${arr[i]}`;

      const workbook = XLSX.readFile(fileName);

      for (let sheetName in workbook["Sheets"]) {
        const workbookHeaders = XLSX.readFile(fileName, {sheetRows: 1});
        const headers = XLSX.utils.sheet_to_json(
          workbookHeaders.Sheets[sheetName],
          {header: 1}
        )[0];
        console.log(
          `........................File_Name = ${arr[i]}  AND Sheet_Name = ${sheetName}..............................`
        );
        console.log(headers);
        // const sheetData = workbook["Sheets"][sheetName];

        // let opts = {
        //   raw: false,
        // };

        // let data = XLSX.utils.sheet_to_json(sheetData, opts).map((row) =>
        //   mapKeys(row, (value, key) =>
        //     key
        //       .trim()
        //       .replace(/\s+/g, "_")
        //       .replace(/[^a-zA-Z0-9_ ]/g, "")
        //       .toLocaleLowerCase()
        //   )
        // );
        // count = count + data.length;
        // console.log(
        //   `........................File_Name = ${arr[i]}  AND Sheet_Name = ${sheetName}..............................`
        // );
        // console.log(data[0]);
        // this.dataFormat(data);
      }
    }
  }
}
const mainProcessObj = new MainProcess();
mainProcessObj.CompDetail();

// const workbookHeaders = xlsx.readFile(filePath, { sheetRows: 1 });
// const columnsArray = xlsx.utils.sheet_to_json(workbookHeaders.Sheets[sheetName], { header: 1 })[0];
