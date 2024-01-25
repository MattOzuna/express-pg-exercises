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
        const results = await db.query('SELECT * FROM invoices WHERE id=$1', [id])
        if (results.rowCount.length === 0){
            throw new ExpressError(`Invoice id ${id} could not be found`, 404)
        }
        return res.json({invoice: results.rows})
    }catch(err){
        return next(err)
    }
})

router.post('/', async (req,res,next) => {
    try{
        const{companyCode, amt} = req.body;
        const returnValue = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1,$2) RETURNING id, comp_code, amt, paid, add_date,', [companyCode, amt])

    }catch(err){
        return next(err)
    }
})
module.exports = router;