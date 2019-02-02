import React from 'react';
import { connect } from 'react-redux';

import { alertShow } from '../../actions/alert';

import ProjectService from '../../services/Project';
import AccountProviderService from '../../services/AccountProvider';

import {fetchProjects} from '../../actions/projects';

import ProjectsTable from './ProjectsTable';

import AlertErrorValidation from '../../components/AlertErrorValidation';
import Icon from '../../components/Icon';
import Dialog from '../../components/Dialog';
import DialogTitle from '../../components/DialogTitle';
import DialogContent from '../../components/DialogContent';
import DialogActions from '../../components/DialogActions';
import TextField from '../../components/TextField';
import Button from '../../components/Button';

class DashboardPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: true,
      projects: [],
      grantedProviders: [],
      errors: [],
      input: {}
    }

    this.handleInputClick = this.handleInputClick.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleDismissModalClick = this.handleDismissModalClick.bind(this);
  }

  componentWillMount() {
	const {dispatch, projects} = this.props;
	
	dispatch(fetchProjects());

    let accountProviderService = new AccountProviderService;

    accountProviderService
      .index('/api/account-providers')
      .then(response => {
        let providers = response.data.filter(provider => {
          return provider.deploy_access_token;
        });
  
        this.setState({grantedProviders: providers});
      });
  }

  /**
   * Handle input change from the project add form.
   *
   * @param {object} event
   */
  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    let input = Object.assign({}, this.state.input);
    input[name] = value;

    this.setState({
      input: input
    });
  }

  /**
   * Handle click for submitting the create project form.
   *
   * @param {object} event
   */
  handleInputClick(event) {
    event.preventDefault();
        
    const { dispatch } = this.props;

    let projectService = new ProjectService;

    projectService
      .post(this.state.input)
      .then(response => {
        dispatch(alertShow('Project created successfully.'));

        $('#project-create-modal').modal('hide');

        let projects = this.state.projects.concat(response.data);

        this.setState({
          projects: projects,
          errors: []
        });
      },
      error => {
        let errorResponse = error.response.data;

        errorResponse = errorResponse.hasOwnProperty('errors') ? errorResponse.errors : errorResponse;
            	
        const errors = Object.keys(errorResponse).reduce(function(previous, key) {
          return previous.concat(errorResponse[key][0]);
        }, []);

        this.setState({errors: errors});
      });
  }

  /**
   * Handle click for dismissing the creat project modal.
   *
   * @param {object} event
   */
  handleDismissModalClick(event) {
    this.setState({errors: []});

    $('#project-create-modal').modal('hide');
  }

  render() {
    const {errors} = this.state;
    const {isFetching, items} = this.props;

    let projectContent = <div className="panel-body">Loading ...</div>;

    if (!isFetching && items.length === 0) {
      projectContent = <div className="panel-body">Add a project to get started!</div>;
    }

    if (!isFetching && items.length > 0) {
      projectContent = <div className="table-responsive"><ProjectsTable projects={items} /></div>
    }

    return (
      <div>
        <div className="breadcrumbs">
          <div className="container">
            <div className="pull-left">
              <span className="heading">Project List</span>
            </div>
            <div className="pull-right">
              <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#project-create-modal">
                <Icon iconName="plus" /> Add Project
              </button>
            </div>
          </div>
        </div>

        <div className="container content">
          <div className="panel panel-default">
            {projectContent}
          </div>
        </div>

        <Dialog id="project-create-modal">
          <DialogTitle>
            Add Project
          </DialogTitle>
          <DialogContent>
            {errors.length ? <AlertErrorValidation errors={errors} /> : ''}

            <h4>Project Details</h4>
            <div className="form-group">
              <TextField 
                id="name" 
                label="Project Name" 
                onChange={this.handleInputChange} 
                name="name"
              />
            </div>

            <h4>Source Control</h4>
            <div className="form-group">
              <label>Providers</label>

              {this.state.grantedProviders.map(grantedProvider => (
                <div key={grantedProvider.id}>
                  <label htmlFor={grantedProvider.name}>
                    <input 
                      name="provider_id"
                      type="radio"
                      value={grantedProvider.id}
                      id={grantedProvider.name}
                      onChange={this.handleInputChange}
                    /> {grantedProvider.name}
                  </label>
                </div>
              ))}
            </div>

            <div className="form-group">
              <TextField 
                id="repository" 
                label="Respository" 
                onChange={this.handleInputChange} 
                name="repository"
                placeholder="user/repository"
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleDismissModalClick}>Cancel</Button>
            <Button color="primary" onClick={this.handleInputClick}>Add Project</Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}
  
const mapStateToProps = (state) => {
  return state.projects;
}

export default connect(
  mapStateToProps		
)(DashboardPage);