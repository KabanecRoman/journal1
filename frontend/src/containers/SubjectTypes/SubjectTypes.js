import React from 'react'
import axios from 'axios';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu'

import './SubjectTypes.css'
import ModalWindow from "../../components/ModalWindow/ModalWindow";
import {ADD_ACTION, UPDATE_ACTION, DELETE_ACTION} from '../../actions/types'
import Loader from "../../components/UI/Loader/Loader";

class SubjectTypes extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            subjectTypes: [],
            name: '',
            itemId: '',
            currentModal: '',
            showModal: false,
            loading: true
        }
    }

    componentDidMount() {
        this.getSubjectTypes()
    }
    //------------->State change<-------------

    setCurrentModal(value) {
        this.setState({
            currentModal: value
        })
        this.setShowModal()
    }

    setShowModal() {
        this.setState({
            showModal: !this.state.showModal,
            name: ''
        })
    }

    setStateId = (e, data, target) => {
        this.setState({
            itemId: data.target.childNodes[0].innerText
        })
        if (data.action === UPDATE_ACTION) {
            this.setCurrentModal(UPDATE_ACTION)
            this.setState({
                name: this.state.subjectTypes.find(element => element.id === +data.target.childNodes[0].innerText).name
            })
        } else if (data.action === DELETE_ACTION) {
            this.setCurrentModal(DELETE_ACTION)
        }
    }

    //------------->State change<-------------

    //------------->BackEnd queries<-------------
    getSubjectTypes() {
        axios.get('api/subject-types/')
            .then(res => {
                this.setState({
                    subjectTypes: res.data.subjectTypes,
                    loading: false
                })
            })
    }

    addSubjectType(name) {
        axios.post('api/subject-types/', {name})
            .then(res => {
                let subjectTypes = [...this.state.subjectTypes]
                subjectTypes.push(res.data)
                this.setState({
                    subjectTypes: subjectTypes,
                    name: ''
                })
            })
    }

    updateSubjectType(id, name) {
        axios.patch(`api/subject-types/${id}`, {name})
            .then(res => {
                this.getSubjectTypes()
            })
            .catch(err => {
                console.log(err.message)
            })
    }

    deleteSubjectType(id) {
        axios.delete(`api/subject-types/${id}`)
            .then(res => {
                this.getSubjectTypes()
            })
            .catch(err => {
                console.log(err.message)
            })
    }


    //------------->HANDLERS<-------------
    handleInputChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        })
    }

    submitHandler = (e) => {
        e.preventDefault()
        switch (this.state.currentModal) {
            case ADD_ACTION:
                this.addSubjectType(this.state.name)
                this.setShowModal()
                break
            case UPDATE_ACTION:
                this.updateSubjectType(this.state.itemId, this.state.name)
                this.setShowModal()
                break
            case DELETE_ACTION:
                this.deleteSubjectType(this.state.itemId)
                this.setShowModal()
                break
            default:
                break
        }
    }

    //------>RENDERS<-------

    renderSubjectTypes() {
        return this.state.subjectTypes.map(subjectType => {
            return (
                <ContextMenuTrigger
                    id='contextmenu-id'
                    name={subjectType.name}
                    holdToDisplay={0}
                    key={ subjectType.id }
                >
                    <div className={'subject-type'} >
                        <p id={'element-id'} style={{display: 'none'}}>{subjectType.id}</p>
                        {subjectType.name}
                    </div>
                </ContextMenuTrigger>
            )
        })
    }

    renderModalHeading() {
        switch (this.state.currentModal) {
            case ADD_ACTION:
                return 'Добавить объект'
            case UPDATE_ACTION:
                return 'Изменить объект'
            case DELETE_ACTION:
                return 'Удалить объект'
            default:
                return 'Заголовок'
        }
    }

    renderForm() {
        switch (this.state.currentModal) {
            case ADD_ACTION:
                return (
                    <form>
                        <input
                            className={'add-input'}
                            placeholder={'Название'}
                            type="text"
                            name={'name'}
                            onChange={ this.handleInputChange }
                            value={this.state.name}
                        />
                    </form>
                )
            case UPDATE_ACTION:
                return (
                    <form>
                        <input
                            className={'add-input'}
                            placeholder={'Название'}
                            type="text"
                            name={'name'}
                            onChange={ this.handleInputChange }
                            value={this.state.name}
                        />
                    </form>
                )
            case DELETE_ACTION:
                return (
                    <form>
                        <div>
                            <h4>Вы уверенны что хотите удалить выбранный объект?</h4>
                        </div>
                    </form>
                )
            default:
                return (
                    <div>ERROR</div>
                )
        }
    }

    renderModal() {
        return (
            <ModalWindow
                show={this.state.showModal}
                onHide={() => this.setShowModal()}
                onSubmit={ this.submitHandler }
                heading={ this.renderModalHeading() }
                body = { this.renderForm() }
            />
        )
    }


    render() {
        return (
            <div className={'container'}>
                {
                    this.state.loading
                        ? <Loader/>
                        : <div className={'subject-types_wrap'}>
                            <button type='button' className='add-button' data-toggle='modal' data-target= '#exampleModalCenter'
                                    onClick={() => this.setCurrentModal('ADD')}>
                                Добавить
                            </button>
                            {this.renderSubjectTypes()}

                            <ContextMenu id='contextmenu-id'>
                                <MenuItem data={{action: UPDATE_ACTION}} onClick={ this.setStateId }>
                                    Изменить
                                </MenuItem>
                                <MenuItem data={{action: DELETE_ACTION}} onClick={ this.setStateId }>
                                    Удалить
                                </MenuItem>
                            </ContextMenu>
                            {this.renderModal()}
                        </div>
                }

            </div>
        )
    }
}

export default SubjectTypes
