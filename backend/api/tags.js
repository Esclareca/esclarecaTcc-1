const Tags = require("../models/Tags");

module.exports = (app) => {
    const save = async (req, res) => {
        const name = req.body.name ? req.body.name.trim().toLowerCase() : ''
        if (name == '') {
            return res.json('Não é possível inserir uma tag vazia')
        }
        const exist = await Tags.find({
            name: { $regex: `${name}`, $options: "i" },
        })
        if (exist === name) {
            return res.json(`A tag ${name} já existe`)
        } else {
            await Tags.create({ name })
                .then((t) => res.json(t))
                .catch((err) => res.status(400).json(err));
        }
    }
    const index = async (req, res) => {
        const search_text = req.headers.search_text ? req.headers.search_text.trim().toLowerCase() : '';

        //Páginação
        const qtdLoad = 10;
        const { page = 1 } = req.query;

        const count = await Tags.find({
            name: { $regex: `${search_text}`, $options: "i" },
        }).countDocuments();

        res.header("X-Total-Count", count);

        const tags = await Tags.find({
            name: { $regex: `${search_text}`, $options: "i" },
        })
            .sort({ name: 1 })
            .skip((page - 1) * qtdLoad)
            .limit(qtdLoad)
            .catch((err) => res.status(400).json(err));
        res.json(tags);
    }

    return {
        save,
        index,
    }
}
