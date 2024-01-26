const express = require('express')
const expressError = require('../expressError')
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req,res,next) => {
    try {
        const results = await db.query('SELECT * FROM invoices')
        return res.json({invoices: results.rows})
    }catch(err){
        return next(err)
    }
})

router.get('/:id', async (req,res,next)=>{
    try{
        const{id} = req.params;
        const results = await db.query('SELECT id, amt, paid,add_date, paid_date, comp_code AS company FROM invoices WHERE id=$1', [id])
        if (results.rowCount.length === 0){
            throw new ExpressError(`Invoice id ${id} could not be found`, 404)
        }
        const company = await db.query('SELECT code, name, description FROM companies WHERE code=$1', [results.rows[0].company])
        results.rows[0].company = company.rows[0]
        return res.json({invoice: results.rows[0]})
    }catch(err){
        return next(err)
    }
})

router.post('/', async (req,res,next) => {
    try{
        const{comp_code, amt} = req.body;
        const returnValue = await db.query(
            `
            INSERT INTO invoices (comp_code, amt) 
            VALUES ($1,$2) 
            RETURNING id, comp_code, amt, paid, add_date, paid_date
            `,
            [comp_code, amt]);
            return res.json({invoice: returnValue.rows[0]})
    }catch(err){
        err.message = `Company code ${req.body.comp_code} could not be found`
        return next(err)
    }
})

router.put('/:id', async (req, res, next) =>{
    try{
        const{id} = req.params;
        const {amt} = req.body;
        const returnValue = await db.query(
            `UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, id]
        )
        if (returnValue.rows.length === 0){
            throw new ExpressError(`Could not find invoice id ${id}`, 404)
        }
        return res.json({invoice: returnValue.rows[0]})
    }catch(err){
        return next(err)
    }
})

router.delete('/:id', async (req, res, next) =>{
    try{
        const {id} = req.params;
        const returnValue = await db.query(
            `DELETE FROM invoices WHERE id=$1 RETURNING id`,
            [id]
        )
        if (returnValue.rows.length === 0){
            throw new ExpressError(`Unable to find invoice id ${id}`, 404)
        }
        return res.json({status: 'deleted'})
    }catch(err){
        return next(err)
    }
})


module.exports = router;