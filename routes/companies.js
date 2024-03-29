const express = require('express')
const expressError = require('../expressError')
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req,res,next) => {
    try{
        const results = await db.query(`SELECT * FROM companies`)
        return res.json({companies: results.rows})
    }catch(err){
        return next(err)
    }
})

router.get('/:code', async (req,res,next) => {
    try{
        const {code} = req.params;
        const company = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`,[code])
        if (company.rows.length === 0){
            throw new expressError(`Company code ${code} could not be found`, 404)
        }
        const invoices = await db.query(`SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE comp_code=$1`, [code])
        company.rows[0].invoices = invoices.rows
        return res.json({company: company.rows[0]})
    }catch(err){
        return next(err)
    }
})

router.post('/', async (req,res, next) =>{
    try{
        const {code, name, description} = req.body;
        if ( !code || !name ) {
            throw new expressError('please incude a code, and name', 400);
        }
        const returnValue = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1,$2,$3) RETURNING code, name, description`,
            [code, name, description]);
        return res.json({company: returnValue.rows[0]});
    } catch(err){
        return next(err);
    }
})

router.put('/:code', async (req,res,next) => {
    try{
        const {code} = req.params;
        const {name, description} = req.body
        const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
        if(results.rows.length === 0){
            throw new ExpressError(`Company code ${code} could not be found`, 404)
        }
        return res.json({company: results.rows[0]})
    }catch(err){
        return next(err)
    }
})


router.delete('/:code', async (req,res,next) =>{
    try{
        const {code} = req.params;
        const results = await db.query('DELETE FROM companies WHERE code=$1 RETURNING code, name, description', [code])
        if(results.rows.length === 0){
            throw new ExpressError(`Company code ${code} could not be found`, 404)
        }
        return res.json({status: 'deleted'})
    }catch(err){
        return next(err)
    }
})



module.exports = router;