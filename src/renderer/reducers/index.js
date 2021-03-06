import { combineReducers } from 'redux';
import databases from './databases';
import servers from './servers';
import queries from './queries';
import connections from './connections';
import tables from './tables';
import status from './status';
import views from './views';
import routines from './routines';
import columns from './columns';
import triggers from './triggers';


const rootReducer = combineReducers({
  databases,
  servers,
  queries,
  connections,
  tables,
  status,
  views,
  routines,
  columns,
  triggers,
});


export default rootReducer;
