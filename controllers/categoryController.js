const Category = require('../models/categoryModel');

const createCategory = async (req, res) => {
    try {
        const name = req.body.name && req.body.name.trim().toLowerCase();
        const description = req.body.description && req.body.description.trim();

        // if user clicks the create button without entering the data
        if (!name || !description) {
            const categoryDetails = await Category.find();
            return res.status(400).render('add-category', {
                category: categoryDetails,
                success: false,
                msg: 'Name and description are required'
            });
        }

        // Check if the category already exists
        const existingCat = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });

        if (existingCat) {
            const categoryDetails = await Category.find();
            return res.status(400).render('add-category', {
                category: categoryDetails,
                success: false,
                msg: 'Category already exists'
            });
        }

        // Create and save the new category
        const category = new Category({ name, description });
        await category.save();

        // Retrieve updated category list and render with success message
        const categoryDetails = await Category.find();
        return res.status(200).render('add-category', {
            category: categoryDetails,
            success: true,
            msg: 'Category added successfully'
        });

    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};


const editCategoryLoad = async (req, res) => {
    try {
        const id = req.query.id;

        if (!id) {
            return res.redirect('/admin/category');
        }

        const categoryData = await Category.findById({ _id: id });

        if (categoryData) {
            return res.render('edit-category', { category: categoryData });
        } else {
            return res.redirect('/admin/category');
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};


const updateCategory = async (req, res) => {
    try {
        const id = req.query.id;
        const name = req.body.name.toLowerCase();
        const description = req.body.description;

        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return res.status(400).render('edit-category', {
                category:existingCategory,
                success: false,
                msg: 'Category donot exist'
            });
        }

        const duplicateCategory = await Category.findOne({ name: name, _id: { $ne: id } });
        if (duplicateCategory) {
            return res.status(400).render('edit-category', {
                category:existingCategory,
                success: false,
                msg: 'Category already exists'
            });
        }

        await Category.findByIdAndUpdate(id, { $set: { name: name, description: description } });
        
        res.redirect('/admin/category');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};

const deleteCategory = async(req,res)=>{
    try {
        const id = req.query.id;
        //soft deletion only
        await Category.findByIdAndUpdate(id,{is_active:false});
        res.redirect('/admin/category');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

const restoreCategory = async(req,res)=>{
    try {
        const id = req.query.id;
        //soft deletion only
        await Category.findByIdAndUpdate(id,{is_active:true});
        res.redirect('/admin/category');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
} 

const loadAddCategory = async(req,res)=>{
    try {
        res.render('add-category');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    createCategory,
    editCategoryLoad,
    updateCategory,
    deleteCategory,
    restoreCategory,
    loadAddCategory
}