const express = require('express');
const Position = require('../models/position');
const positionRouter = express.Router();

positionRouter.post('/api/admin/position', async (req, res) => {
    try {
        const { departmentId, departmentName, positionName } = req.body;
        const position = new Position({ departmentId, departmentName, positionName });
        await position.save();
        res.status(201).send(position);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
positionRouter.get('/api/admin/position/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const position = await Position.findById(id);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.status(200).json(position);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

positionRouter.get('/api/admin/positions/:departmentId', async(req, res)=>{
    try {
        const {departmentId} = req.params;
         // Tìm tất cả position có departmentId = departmentId
        const positions = await Position.find({ departmentId: departmentId });

        if(!positions || positions.length == 0){
            return res.status(404).json({msg: "potisions not found"});
        }else{
            return res.status(200).json(positions);
        }
    } catch (error) {
        res.status(500).send({error: error.message});
    }
});

positionRouter.put('/api/admin/position/:id', async (req, res)=>{
    try {
        const {id} = req.params;
        const {departmentName, positionName} = req.body;

        const position = await Position.findByIdAndUpdate(
            id,
            { departmentName, positionName },
            { new: true, runValidators: true } // new:true trả về object sau khi update
        );
         if (!position) {
            return res.status(404).json({ error: "position not found" });
        }
        res.status(200).send(position);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});

positionRouter.delete('/api/admin/position/:id', async (req, res) => {
  try { 
    const { id } = req.params;

    const position = await Position.findByIdAndDelete(id);

    if (!position) {
      return res.status(404).json({ error: "position not found" });
    }

    res.status(200).json({ message: "position deleted successfully", position });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = positionRouter;

