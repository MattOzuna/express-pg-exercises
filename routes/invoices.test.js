process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require('../db');


let testCompany;
let testInvoice;
beforeEach( async ()=>{
    //can't do both queries at the same time because the company needs to exist first
    const newCompany = await db.query(
        `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3) 
        RETURNING code, name, description`, 
        ['test', 'test company', 'This is a test company']
    )
    testCompany = newCompany.rows[0]
    const newInvoices = await db.query(
        `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, amt, comp_code, paid, add_date, paid_date`,
        [testCompany.code, 99]
        )
    testInvoice = newInvoices.rows[0]
})

afterEach( async ()=>{
    //invoices has on delete cascade set uo for comapnies, so deleting a company deletes invoices
    await db.query('DELETE FROM companies');
})

afterAll( async()=>{
    await db.end();
})

describe('GET /invoices', ()=>{
    test('Gets a list of invoices', async () => {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toBe(200)
        // expect(response.body).toEqual({invoices: testInvoice})
    })
})

describe('GET /invoices/:id', ()=>{
    test('Gets a single invoice by id', async ()=>{
        const response = await request(app).get(`/invoices/${testInvoice.id}`)
        expect(response.statusCode).toBe(200)
    })
})