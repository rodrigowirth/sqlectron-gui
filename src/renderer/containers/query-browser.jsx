import { debounce } from 'lodash';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { sqlectron } from '../../browser/remote';
import * as ConnActions from '../actions/connections.js';
import * as QueryActions from '../actions/queries';
import { fetchDatabasesIfNeeded } from '../actions/databases';
import { fetchTablesIfNeeded } from '../actions/tables';
import { fetchTableColumnsIfNeeded } from '../actions/columns';
import { fetchTableTriggersIfNeeded } from '../actions/triggers';
import { fetchViewsIfNeeded } from '../actions/views';
import { fetchRoutinesIfNeeded } from '../actions/routines';
import DatabaseFilter from '../components/database-filter.jsx';
import DatabaseList from '../components/database-list.jsx';
import Header from '../components/header.jsx';
import Footer from '../components/footer.jsx';
import Query from '../components/query.jsx';
import Loader from '../components/loader.jsx';
import MenuHandler from '../menu-handler';


import { ResizableBox } from 'react-resizable';
require('../components/react-resizable.css');
require('../components/react-tabs.scss');


const STYLES = {
  wrapper: {},
  container: { display: 'flex', height: '100vh', boxSizing: 'border-box', padding: '50px 10px 40px 10px' },
  sidebar: { overflowY: 'auto' },
  content: { flex: 1, overflow: 'auto', paddingLeft: '5px' },
  resizeable: { width: 'auto', maxWidth: '100%' },
};


const CLIENTS = sqlectron.db.CLIENTS.reduce((clients, dbClient) => {
  clients[dbClient.key] = { title: dbClient.name };
  return clients;
}, {});


class QueryBrowserContainer extends Component {
  static propTypes = {
    connections: PropTypes.object.isRequired,
    status: PropTypes.string.isRequired,
    databases: PropTypes.object.isRequired,
    tables: PropTypes.object.isRequired,
    columns: PropTypes.object.isRequired,
    triggers: PropTypes.object.isRequired,
    views: PropTypes.object.isRequired,
    routines: PropTypes.object.isRequired,
    queries: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    location: PropTypes.shape({ query: PropTypes.object }),
    children: PropTypes.node,
  };

  static contextTypes = {
    history: PropTypes.object.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {};
    this.menuHandler = new MenuHandler();
  }

  componentWillMount () {
    const { dispatch, params } = this.props;
    dispatch(ConnActions.connect(params.id));
  }

  componentDidMount() {
    this.setMenus();
  }

  componentWillReceiveProps (nextProps) {
    const { dispatch, history, connections } = nextProps;

    if (connections.error || (!connections.connecting && !connections.server)) {
      history.pushState(null, '/');
      return;
    }

    if (!connections.connected) {
      return;
    }

    const lastConnectedDB = connections.databases[connections.databases.length - 1];

    dispatch(fetchDatabasesIfNeeded());
    dispatch(fetchTablesIfNeeded(lastConnectedDB));
    dispatch(fetchViewsIfNeeded(lastConnectedDB));
    dispatch(fetchRoutinesIfNeeded(lastConnectedDB));

    this.setMenus();
  }

  componentWillUnmount() {
    this.menuHandler.removeAllMenus();
  }

  onSelectDatabase(database) {
    const { dispatch, params } = this.props;

    dispatch(ConnActions.connect(params.id, database.name));
  }

  onDoubleClickTable(database, table) {
    this.props.dispatch(QueryActions.executeDefaultSelectQueryIfNeeded(database.name, table.name));
  }

  onSelectTable(database, table) {
    this.props.dispatch(fetchTableColumnsIfNeeded(database.name, table.name));
    this.props.dispatch(fetchTableTriggersIfNeeded(database.name, table.name));
  }

  onSQLChange (sqlQuery) {
    this.props.dispatch(QueryActions.updateQueryIfNeeded(sqlQuery));
  }

  onFilterChange (value) {
    this.setState({ filter: value });
  }

  onCloseConnectionClick() {
    const { dispatch } = this.props;
    dispatch(ConnActions.disconnect());
  }

  onReConnectionClick() {
    const { dispatch, params } = this.props;
    dispatch(ConnActions.reconnect(params.id, this.getCurrentQuery().database));
  }

  getCurrentQuery() {
    return this.props.queries.queriesById[this.props.queries.currentQueryId];
  }

  setMenus() {
    this.menuHandler.setMenus({
      'sqlectron:query-execute': () => {
        const { queries: { queriesById, currentQueryId } } = this.props;
        this.handleExecuteQuery(queriesById[currentQueryId].query);
      },
      'sqlectron:new-tab': () => this.newTab(),
      'sqlectron:save-query': () => this.saveQuery(),
    });
  }

  handleSelectTab(index) {
    const queryId = this.props.queries.queryIds[index];
    this.props.dispatch(QueryActions.selectQuery(queryId));
  }

  removeQuery(queryId) {
    this.props.dispatch(QueryActions.removeQuery(queryId));
  }

  saveQuery() {
    this.props.dispatch(QueryActions.saveQuery());
  }

  copyToClipboard (rows, type) {
    this.props.dispatch(QueryActions.copyToClipboard(rows, type));
  }

  handleExecuteQuery (sqlQuery) {
    this.props.dispatch(QueryActions.executeQueryIfNeeded(sqlQuery));
  }

  filterDatabases(name, databases) {
    const regex = RegExp(name, 'i');
    return databases.filter(db => regex.test(db.name));
  }

  newTab() {
    this.props.dispatch(QueryActions.newQuery(this.getCurrentQuery().database));
  }

  renderTabQueries() {
    const { connections, queries } = this.props;

    const menu = queries.queryIds.map(queryId => {
      const isCurrentQuery = queryId === queries.currentQueryId;
      return (
        <Tab key={queryId} className={`item ${isCurrentQuery ? 'active' : ''}`}>
          {queries.queriesById[queryId].name}
          <button className="right floated ui icon button mini"
            onClick={debounce(() => this.removeQuery(queryId), 200)}>
            <i className="icon remove"></i>
          </button>
        </Tab>
      );
    });

    const panels = queries.queryIds.map(queryId => {
      const query = queries.queriesById[queryId];
      return (
        <TabPanel key={queryId}>
          <Query
            client={connections.server.client}
            query={query}
            onExecQueryClick={::this.handleExecuteQuery}
            onCopyToClipboardClick={::this.copyToClipboard}
            onSQLChange={::this.onSQLChange} />
        </TabPanel>
      );
    });

    const selectedIndex = queries.queryIds.indexOf(queries.currentQueryId);
    return (
      <Tabs onSelect={::this.handleSelectTab} selectedIndex={selectedIndex}>
        <TabList className="ui pointing secondary menu">{menu}</TabList>
        {panels}
      </Tabs>
    );
  }

  render() {
    const { filter } = this.state;
    const {
      status,
      connections,
      databases,
      tables,
      columns,
      triggers,
      views,
      routines,
    } = this.props;

    const isLoading = (!connections.connected);
    if (isLoading && (!connections.server || !this.getCurrentQuery())) {
      return <Loader message={status} type="page" />;
    }

    const breadcrumb = connections.server ? [
      { icon: 'server', label: connections.server.name },
      { icon: 'database', label: this.getCurrentQuery().database },
    ] : [];

    const currentClient = CLIENTS[connections.server.client];
    const filteredDatabases = this.filterDatabases(filter, databases.items);

    return (
      <div style={STYLES.wrapper}>
        { isLoading && <Loader message={status} type="page" />}
        <div style={STYLES.header}>
          <Header items={breadcrumb}
            onCloseConnectionClick={::this.onCloseConnectionClick}
            onReConnectionClick={::this.onReConnectionClick} />
        </div>
        <div style={STYLES.container}>
          <div style={STYLES.sidebar}>
            <ResizableBox className="react-resizable react-resizable-ew-resize"
              width={235}
              minConstraints={[235, 300]}
              maxConstraints={[750, 10000]}>
              <div className="ui vertical menu" style={STYLES.resizeable}>
                <div className="item active" style={{textAlign: 'center'}}>
                  <b>{currentClient.title}</b>
                </div>
                <div className="item">
                  <DatabaseFilter
                    value={filter}
                    isFetching={databases.isFetching}
                    onFilterChange={::this.onFilterChange} />
                </div>
                <DatabaseList
                  databases={filteredDatabases}
                  isFetching={databases.isFetching}
                  tablesByDatabase={tables.itemsByDatabase}
                  columnsByTable={columns.columnsByTable}
                  triggersByTable={triggers.triggersByTable}
                  viewsByDatabase={views.viewsByDatabase}
                  functionsByDatabase={routines.functionsByDatabase}
                  proceduresByDatabase={routines.proceduresByDatabase}
                  onSelectDatabase={::this.onSelectDatabase}
                  onDoubleClickTable={::this.onDoubleClickTable}
                  onSelectTable={::this.onSelectTable} />
              </div>
            </ResizableBox>
          </div>
          <div style={STYLES.content}>
              {this.renderTabQueries()}
          </div>
        </div>
        <div style={STYLES.footer}>
          <Footer status={status} />
        </div>
      </div>
    );
  }
}


function mapStateToProps (state) {
  const { connections, databases, tables, columns, triggers, views, routines, queries, status } = state;

  return {
    connections,
    databases,
    tables,
    columns,
    triggers,
    views,
    routines,
    queries,
    status,
  };
}


export default connect(mapStateToProps)(QueryBrowserContainer);
