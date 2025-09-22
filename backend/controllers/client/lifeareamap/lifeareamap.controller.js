const responses = require("../../../constants/responses");
const { prisma } = require("../../../configs/prisma");

async function create(req, res, next) {
    try {
        const { name, sub_goals } = req.body;
        const { userId } = req.user;

        const lifeArea = await prisma.life_area.create({
            data: {
                user_id: userId,
                name,
                sub_goals: sub_goals || [],
            },
        });

        return res
            .status(201)
            .json(responses.okResponse(lifeArea, "Life area created successfully."));
    } catch (error) {
        console.error("Create Life Area Error:", error);
        return next(error);
    }
}

async function getAll(req, res, next) {
    try {
        const { userId } = req.user;

        const lifeAreas = await prisma.life_area.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "asc" },
            include: {
                sub_goals: true
            }
        }

        );

        return res
            .status(200)
            .json(responses.okResponse(lifeAreas, "Life areas fetched successfully."));
    } catch (error) {
        return next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;

        const lifeArea = await prisma.life_area.findUnique({
            where: { id },
        });

        if (!lifeArea) {
            return res
                .status(404)
                .json(responses.badRequestResponse("Life area not found."));
        }

        return res
            .status(200)
            .json(responses.okResponse(lifeArea, "Life area fetched successfully."));
    } catch (error) {
        console.error("Get Life Area Error:", error);
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const { name, sub_goals } = req.body;

        const updatedLifeArea = await prisma.life_area.update({
            where: { id },
            data: {
                name,
                sub_goals: sub_goals || [],
            },
        });

        return res
            .status(200)
            .json(responses.updateSuccessResponse(updatedLifeArea, "Life area updated successfully."));
    } catch (error) {
        console.error("Update Life Area Error:", error);
        return next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;

        await prisma.life_area.delete({
            where: { id },
        });

        return res
            .status(200)
            .json(responses.deleteSuccessResponse(null, "Life area deleted successfully."));
    } catch (error) {
        console.error("Delete Life Area Error:", error);
        return next(error);
    }
}

module.exports = {
    create,
    getAll,
    getOne,
    update,
    remove,
};
