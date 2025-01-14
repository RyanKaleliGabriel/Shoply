interface QueryStr {
  [key: string]: any;
}

class APIfeatures {
  query: any;
  queryString: QueryStr;
  values: any[];

  constructor(query: any, queryString: QueryStr) {
    this.query = query;
    this.queryString = queryString;
    this.values = [];
  }

  filter() {
    const queryObj: QueryStr = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    const operatorsMap: { [key: string]: string } = {
      gte: ">=",
      gt: ">",
      lte: "<=",
      lt: "<",
    };

    const filters: string[] = [];
    let index = 1;

    for (const key in queryObj) {
      const value = queryObj[key];

      // Check if value is an object (e.g., { gte: '100' })
      if (typeof value === "object" && value !== null) {
        for (const operatorKey in value) {
          const operator = operatorsMap[operatorKey];
          if (operator) {
            filters.push(`${key} ${operator} $${index}`);
            this.values.push(value[operatorKey]);
            index++;
          }
        }
      } else {
        // Handle simple key-value pairs (e.g., `name=John`)
        filters.push(`${key} = $${index}`);
        this.values.push(value);
        index++;
      }
    }

    if (filters.length > 0) {
      this.query += ` WHERE ${filters.join(" AND ")}`;
    }

    return this;
  }

  // Sort rows by the specified fields
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(", ");
      this.query += ` ORDER BY ${sortBy}`;
    }
    return this;
  }

  // Select specific fields
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(", ");
      this.query = this.query.replace("*", fields);
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    // OFFSET -  Specifies the number of rows to skip before starting to return rows.
    const offset = (page - 1) * limit;
    //LIMIT - Specifies the maximum number of rows to return.
    this.query += ` LIMIT $${this.values.length + 1} OFFSET $${
      this.values.length + 2
    }`;
    this.values.push(limit, offset);
    return this;
  }
}

export default APIfeatures;
