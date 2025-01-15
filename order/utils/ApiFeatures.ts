// interface QueryStr {
//   [key: string]: any;
// }

// class APIfeatures {
//   query: any;
//   queryString: QueryStr;
//   values: any[];


//   constructor(query: any, queryString: QueryStr) {
//     this.query = query;
//     this.queryString = queryString;
//   }

//   //   filter() {
//   //     const queryObj: QueryStr = { ...this.queryString };
//   //     const excludedFields = ["page", "sort", "limit", "fields"];

//   //     excludedFields.forEach((el) => delete queryObj[el]);

//   //     let queryStr = JSON.stringify(queryObj)

//   //   }

//   // Sort rows by the specified fields
//   sort() {
//     if (this.queryString.sort) {
//       const sortBy = this.queryString.sort.split(",").join(", ");
//       this.query += ` ORDER BY ${sortBy}`;
//     }
//     return this;
//   }

//   // Select specific fields
//   limitFields() {
//     if (this.queryString.fields) {
//       const fields = this.queryString.fields.split(",").join(", ");
//       this.query = this.query.replace("*", fields);
//     }
//     return globalThis;
//   }

//   paginate() {
//     const page = parseInt(this.queryString.page, 10) || 1;
//     const limit = parseInt(this.queryString.limit, 10) || 10;
//     const offset = (page - 1) * limit;

//     this.query += ` LIMIT $${this.values.length + 1} OFFSET $${
//       this.values.length + 2
//     }`;
//     this.values.push(limit, offset);

//     return this;
//   }
// }
