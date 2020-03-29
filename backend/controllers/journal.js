const Journal = require('../models/Journal')
const Students = require('../models/Students')
const Date = require('../models/Date')
const { Op } = require("sequelize");

module.exports.getData = async (req, res) => {
    try {
        const errors = {}

        //Students search by broup
        const studentsGroup = await Students.findAll({
            where: {
                group_id: req.body.group_id
            }
        })
        let students_id = []
        for(let i = 0; i < studentsGroup.length; i++) {
            students_id.push(studentsGroup[i].id)
        }

        //Students search by journal
        const studentFromJournal = await Journal.findAll({
            attributes: ['student_id'],
            group: ['student_id'],
            where: {
                user_id: req.body.user_id,
                subject_id: req.body.subject_id,
                type_id: req.body.type_id,
                student_id: {
                    [Op.in]: students_id
                }
            }
        })
        let studentsFromJournal_id = []
        for(let i = 0; i < studentFromJournal.length; i++) {
            studentsFromJournal_id.push(studentFromJournal[i].student_id)
        }

        //Dates search by journal
        const datesFromJournal = await Journal.findAll({
            attributes: ['date_id'],
            group: ['date_id'],
            where: {
                user_id: req.body.user_id,
                subject_id: req.body.subject_id,
                type_id: req.body.type_id,
                student_id: {
                    [Op.in]: students_id
                }
            }
        })
        let datesFromJournal_id = []
        for(let i = 0; i < datesFromJournal.length; i++) {
            datesFromJournal_id.push(datesFromJournal[i].date_id)
        }

        const dates = await Date.findAll({
            where: {
                id: {
                    [Op.in]: datesFromJournal_id
                }
            },
            order: [[ 'date', 'ASC' ]]
        })

        //Students
        const students = await Students.findAll({
            where: {
                id: {
                    [Op.in]: studentsFromJournal_id
                }
            },
            order: [
                ['surname', 'ASC'],
                ['name', 'ASC'],
                ['patronymic', 'ASC']
            ]
        })
        const journal = await Journal.findAll({
            where: {
                user_id: req.body.user_id,
                subject_id: req.body.subject_id,
                type_id: req.body.type_id,
                student_id: {
                    [Op.in]: students_id
                }
            },
            include: {
                model: Date,
                required: true
            },
            order: [
                ['dates', 'date', 'ASC']
            ]
        })
        if (Array.isArray(journal) && journal.length === 0) {
            errors.search = 'Журнал не найден'
            return res.status(404).json(errors)
        } else {
            res.status(200).json({
                journal,
                students,
                dates
            })
        }

    } catch (e) {
        console.log(e.message)
    }
}

module.exports.updateStudentData = async (req, res) => {
    try {
        const studentData = await Journal.update({
                present: req.body.present,
                note: req.body.note,
                score: req.body.score,
                valid_miss: req.body.valid_miss
            },
            {
                where : {
                    user_id: req.body.user_id,
                    date_id: req.body.date_id,
                    subject_id: req.body.subject_id,
                    student_id: req.body.student_id,
                    type_id: req.body.type_id
                }
            }
        )
        res.status(200).json({
            studentData
        })
    } catch (e) {
        console.log(e.message)
    }
}

module.exports.addTaskByDate = async (req, res) => {
    try {
        const errors = {}
        const date = await Date.findOrCreate({
            where: {
                date: req.body.date
            },
            defaults: {
                date: req.body.date,
                time: null
            }
        }).catch(e => {
            errors.date = 'Неправильная дата'
            res.status(401).json(errors)
        })
        const studentsGroup = await Students.findAll({
            where: {
                group_id: req.body.group_id
            }
        })

        //get all students from group
        let studentsGroup_ids = []
        for(let i = 0; i < studentsGroup.length; i++) {
            studentsGroup_ids.push(studentsGroup[i].id)
        }
        //get all students from journal
        const studentsJournal = await Journal.findAll({
            attributes: ['student_id'],
            where: {
                student_id: {
                    [Op.in]: studentsGroup_ids
                }
            },
            group: ['student_id']
        })
        let studentsJournal_ids = []
        for(let i = 0; i < studentsJournal.length; i++) {
            studentsJournal_ids.push(studentsJournal[i].student_id)
        }
        //check if all students consist
        let checker = (arr, target) => target.every(v => arr.includes(v))
        //if student which is not in the all tasks consists insert it
        if (!checker(studentsJournal_ids, studentsGroup_ids)) {
            //get all dates from journal
            const journalDates = await Journal.findAll({
                attributes: ['date_id'],
                group: ['date_id']
            })
            //filter only students which doesnt consist in all tasks
            const filtered_ids = studentsGroup_ids.filter(i => !studentsJournal_ids.includes(i))
            //insert student in all existing tasks
            journalDates.map(date => {
                filtered_ids.map(async student_id => {
                    try {
                        await Journal.create({
                            user_id: req.body.user_id,
                            subject_id: req.body.subject_id,
                            student_id: student_id,
                            present: true,
                            note: '',
                            score: null,
                            date_id: date.date_id,
                            type_id: req.body.type_id,
                            valid_miss: false
                        })
                    } catch (e) {
                        console.log(e.message)
                    }
                })
            })
        }
        //insert students in new task
        studentsGroup.map(async el => {
            try {
                await Journal.create({
                    user_id: req.body.user_id,
                    subject_id: req.body.subject_id,
                    student_id: el.id,
                    present: true,
                    note: '',
                    score: null,
                    date_id: date[0].id,
                    type_id: req.body.type_id,
                    valid_miss: false
                }).catch(e => {
                    errors.task = 'Ошибка добавления'
                    res.status(401).json(errors)
                })
            } catch (e) {
                console.log(e.message)
            }

        })
        res.status(201).json('Добавление успешно')
    } catch (e) {
        console.log(e.message)
    }
}