const blogModel = require('../models/bolgModel')
const authorModel = require('../models/authorModel')
const { idCharacterValid, isValidString } = require("../validator/validator");

//===========================// createBlog //============================================

const createBlog = async function (req, res) {
    try {
        const data = req.body
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "request body is Empty" })
        const { title, body, authorId, category } = data

        if (!title) return res.status(400).send({ status: false, message: "title is requred" });
        if (!body) return res.status(400).send({ status: false, message: "body is requred" });
        if (!authorId) return res.status(400).send({ status: false, message: "authorId is requred" });
        if (!category) return res.status(400).send({ status: false, message: "category is requred" });

        if (!isValidString(title)) return res.status(400).send({ status: false, message: "Please provide valid title" })
        if (!isValidString(body)) return res.status(400).send({ status: false, message: "Please provide valid body" })
        if (!isValidString(category)) return res.status(400).send({ status: false, message: "Please provide valid category" });

        if (!idCharacterValid(authorId)) return res.status(400).send({ status: false, message: "Please provide the valid authorid" })
        const authordata = await authorModel.find({ _id: data.authorId })
        if (authordata.length==0) return res.status(400).send({ status: false, message: "author Id doesn't exist" })

        const savedData = await blogModel.create(data)
        return res.status(201).send({ status: true, data: savedData })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//===========================// getData //=============================================================

const getData = async function (req, res) {
    try {
        if (Object.keys(req.query).length == 0) {
            let savedata = await blogModel.find({ isDeleted: false, isPublished: true })
            if (savedata.length == 0) {
                return res.status(404).send({ status: false, message: "blogs not found" })
            } else {
                return res.status(200).send({ status: true, data: savedata })
            }
        }
        if (Object.keys(req.query).length > 0) {
            let savedata2 = await blogModel.find({ $and: [{ isDeleted: false, isPublished: true }, req.query] })
            if (savedata2.length == 0) return res.status(404).send({ status: false, message: "this blog not found" })

            res.status(200).send({ status: true, message: savedata2 })
        }
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }

}

//===============================// updateBlog //=============================================

const updateBlog = async function (req, res) {
    try {
        let blogId = req.params.blogId
        if (!idCharacterValid(blogId)) return res.status(400).send({ status: false, message: "please provide the valid blogId " })
        let isValidBlogId = await blogModel.findById(blogId)
        if (!isValidBlogId) {
            return res.status(404).send({ status: false, message: "this blog is not exist" })
        } else {
            let isDeleted = await blogModel.findOne({ _id: blogId, isDeleted: false })
            if (!isDeleted) return res.status(400).send({ status: false, message: "this blog is already deleted" })

            const { title, body, category, tags, subcategory } = req.body
            let time = new Date(Date.now())
            let updateBlog = await blogModel.findOneAndUpdate(
                { _id: blogId },
                {
                    $set: {
                        title: title,
                        body: body,
                        category: category,
                        publishedAt: time,
                        isPublished: true,
                    },
                    $push: { tags: tags, subcategory: subcategory },
                },
                { new: true }
            )
            res.status(200).send({ status: true,message:"updated sucessfully", data: updateBlog })
        }
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//==========================================// DELETEdata //===========================================

const DELETEdata = async function (req, res) {
    try {
        let data = req.params.blogId
        if (!idCharacterValid(data)) return res.status(400).send({ status: false, message: "Please provide the valid blogid" })
        let savedata = await blogModel.findById(data)

        if (!savedata) return res.status(404).send({ status: false, message: "blogs not found" })
        if (savedata.isDeleted == true) return res.status(404).send({ status: true, message: "this data is alredy deleted" })
        await blogModel.findByIdAndUpdate(data, { $set: { isDeleted: true, deletedAt: new Date(Date.now()) } }, { new: true })
        res.status(200).send({status:true})
    } catch (err) {
        console.log(err.message)
        return res.status(500).send({ status: false, error: err.message })
    }
}

//===================================// deleteunpublished //==============================================

const deleteunpublished = async function (req, res) {
    try {
        let id=req.id
        let datas = await blogModel.updateMany({ $and: [{ isDeleted: false,authorId:id }, req.query] }, { isDeleted: true, deletedAt: new Date(Date.now()) }, { new: true })
        if (datas.modifiedCount == 0)  return res.status(404).send({ status: false, message: "Blogs not found " })
       
        return res.status(200).send({ status: true, deletedData: datas.modifiedCount }) 
    } catch (err) {    
        return res.status(500).send({ status: false, error: err.message })
    }
}

//========================// module exports //==============================================

module.exports = { updateBlog, getData, createBlog, deleteunpublished, DELETEdata }