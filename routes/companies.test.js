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
        RETURNING id, amt, paid, add_date, paid_date`,
        [testCompany.code, 99 ]
        )
    testInvoice = newInvoices.rows
})

afterEach( async ()=>{
    //invoices has on delete cascade set uo for comapnies, so deleting a company deletes invoices
    await db.query('DELETE FROM companies');
})

afterAll( async()=>{
    await db.end();
})

describe('GET /companies', ()=>{
    test('Gets a list of companies', async () => {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({companies:[testCompany]})
    })
})

describe('GET /companies/:code', ()=>{
    test('Gets a single company by code', async ()=>{
        const response = await request(app).get('/companies/test')
        expect(response.statusCode).toBe(200)
        expect(response.body.company.code).toEqual(testCompany.code)
        expect(response.body.company.name).toEqual(testCompany.name)
        expect(response.body.company.description).toEqual(testCompany.description)
        expect(response.body.company.invoices.id).toEqual(testInvoice.id)
    })
    test('Expect error for a wrong company code', async()=>{
        const response = await request(app).get('/companies/apple')
        expect(response.statusCode).toBe(404)
    })
})

describe('POST /companies', ()=>{
    test('Post a new company', async()=>{
        const response = await request(app).post('/companies').send({
            code: 'apple',
            name: 'apple computers',
            description: 'The biggest company in the world'
        })
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({company: {
            code: 'apple',
            name: 'apple computers',
            description: 'The biggest company in the world'
        }})
    })
    test('expect error if no code sent', async ()=>{
        const response = await request(app).post('/companies')
        expect(response.statusCode).toBe(400)
    })
})

describe('PUT /companies/:code', ()=>{
    test("Update a company's info", async()=>{
        const response = await request(app).put('/companies/test').send({ 
            name: 'apple_computers', 
            description: 'Big Test'
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company: {
            code: testCompany.code, 
            name: 'apple_computers', 
            description: 'Big Test'
        }});
    })
    test('expect error if wrong code sent', async ()=>{
        const response = await request(app).put('/companies/wrong')
        expect(response.statusCode).toBe(404)
    })
})

describe('DELETE /companies/:code', ()=>{
    test('Delete a company', async()=>{
        const response = await request(app).delete('/companies/test')
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({status: 'deleted'});

        const dbResult = await db.query(`SELECT * FROM companies WHERE code=$1`, [testCompany.code])
        expect(dbResult.rows.length).toEqual(0)
    })
    test('expect error if wrong code sent', async ()=>{
        const response = await request(app).delete('/companies/wrong')
        expect(response.statusCode).toBe(404)
    })
})