// Credit for The NATS.IO Authors
// Copyright 2021-2022 The Memphis Authors
// Licensed under the Apache License, Version 2.0 (the “License”);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an “AS IS” BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.package server

import './style.scss';

import React, { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';

import Reducer from './hooks/reducer';

import './style.scss';
import { ApiEndpoints } from '../../const/apiEndpoints';
import { httpRequest } from '../../services/http';
import filterImg from '../../assets/images/filter.svg';
import searchIcon from '../../assets/images/searchIcon.svg';

import CustomCollapse from './customCollapse';
import { Popover } from 'antd';
import { filterType, labelType } from '../../const/filterConsts';
import { CircleLetterColor } from '../../const/circleLetterColor';

import Button from '../button';
import { Context } from '../../hooks/store';
import { useHistory } from 'react-router-dom';
import pathDomains from '../../router';
import SearchInput from '../searchInput';

const initialState = {
    isOpen: false,
    counter: 0,
    filterFields: []
};

const Filter = ({ filterComponent, height }) => {
    const [state, dispatch] = useContext(Context);
    const [filterState, filterDispatch] = useReducer(Reducer, initialState);

    const [tagList, setTagList] = useState([]);
    const [filterFields, setFilterFields] = useState([]);
    const [filterTerms, setFilterTerms] = useState([]);
    const [searchInput, setSearchInput] = useState('');

    const history = useHistory();

    useEffect(() => {
        buildFilter();
    }, [state?.domainList]);

    const handleRegisterToStation = useCallback(() => {
        switch (filterComponent) {
            case 'stations':
                state.socket?.emit('get_all_stations_data');
            case 'schema':
                state.socket?.emit('schemas_overview_data');
        }
    }, [state.socket, filterComponent]);

    useEffect(() => {
        switch (filterComponent) {
            case 'stations':
                state.socket?.on(`stations_overview_data`, (data) => {
                    data.sort((a, b) => new Date(b.station.creation_date) - new Date(a.station.creation_date));
                    dispatch({ type: 'SET_DOMAIN_LIST', payload: data });
                });
            case 'schema':
                state.socket?.on('schemas_overview_data', (data) => {
                    dispatch({ type: 'SET_DOMAIN_LIST', payload: data });
                });
        }

        state.socket?.on('error', (error) => {
            // history.push(pathDomains.overview);
        });

        setTimeout(() => {
            handleRegisterToStation();
        }, 1000);

        return () => {
            state.socket?.emit('deregister');
        };
    }, [state.socket, filterComponent]);

    const handleSearch = (e) => {
        setSearchInput(e.target.value);
    };

    const buildFilter = () => {
        switch (filterComponent) {
            case 'stations':
                if (state?.route === 'stations') {
                    getTags();
                    getFilterData(state?.domainList);
                }
                return;
            case 'schema':
                if (state?.route === 'schemas') {
                    getTags();
                    getFilterData(state?.domainList);
                }
                return;
            default:
                return;
        }
    };

    useEffect(() => {
        getTagsFilter();
    }, [tagList.length > 0]);

    useEffect(() => {
        filterDispatch({ type: 'SET_FILTER_FIELDS', payload: filterFields });
    }, [filterFields]);

    useEffect(() => {
        handleFilter();
    }, [searchInput, filterTerms, state?.domainList]);

    const getFilterData = (data) => {
        switch (filterComponent) {
            case 'stations':
                getStationFilter(data);
                return;
            case 'schema':
                getSchemaFilter(data);
                return;
        }
    };
    const getSchemaFilter = (schemas) => {
        let filteredFields = filterFields;
        if (filteredFields.findIndex((x) => x.name === 'created') === -1) {
            let createdBy = [];
            schemas.forEach((item) => {
                createdBy.push(item.created_by_user);
            });
            const created = [...new Set(createdBy)].map((user) => {
                return {
                    name: user,
                    color: CircleLetterColor[user[0]?.toUpperCase()],
                    checked: false
                };
            });
            const createdByFilter = {
                name: 'created',
                value: 'Created By',
                labelType: labelType.CIRCLEDLETTER,
                filterType: filterType.CHECKBOX,
                fields: created
            };
            createdByFilter.fields.length > 0 && filteredFields.push(createdByFilter);
        }
        if (filteredFields.findIndex((x) => x.name === 'type') === -1) {
            const storageTypeFilter = {
                name: 'type',
                value: 'Type',
                filterType: filterType.RADIOBUTTON,
                radioValue: -1,
                fields: [{ name: 'Protobuf' }, { name: 'Avro' }, { name: 'Json' }]
            };
            filteredFields.push(storageTypeFilter);
        }
        if (filteredFields.findIndex((x) => x.name === 'dateandtype') === -1) {
            const dates = {
                name: 'dateandtype',
                value: 'Date & Time',
                filterType: filterType.DATE,
                fields: [
                    { name: 'from', label: 'From' },
                    { name: 'to', label: 'To' }
                ]
            };
            filteredFields.push(dates);
        }
        if (filteredFields.findIndex((x) => x.name === 'usage') === -1) {
            const usageFilter = {
                name: 'usage',
                value: 'Usage',
                filterType: filterType.RADIOBUTTON,
                radioValue: -1,
                fields: [{ name: 'Used' }, { name: 'Not Used' }]
            };
            filteredFields.push(usageFilter);
        }
        setFilterFields(filteredFields);
    };

    const getStationFilter = (stations) => {
        let filteredFields = filterFields;
        if (filteredFields.findIndex((x) => x.name === 'created') === -1) {
            let createdBy = [];

            stations.forEach((item) => {
                createdBy.push(item.station.created_by_user);
            });
            const created = [...new Set(createdBy)].map((user) => {
                return {
                    name: user,
                    color: CircleLetterColor[user[0]?.toUpperCase()],
                    checked: false
                };
            });
            const createdByFilter = {
                name: 'created',
                value: 'Created By',
                labelType: labelType.CIRCLEDLETTER,
                filterType: filterType.CHECKBOX,
                fields: created
            };
            createdByFilter.fields.length > 0 && filteredFields.push(createdByFilter);
        }
        if (filteredFields.findIndex((x) => x.name === 'storage') === -1) {
            const storageTypeFilter = {
                name: 'storage',
                value: 'Storage Type',
                filterType: filterType.CHECKBOX,
                labelType: '',
                fields: [
                    { name: 'Memory', value: 'memory' },
                    { name: 'File', value: 'file' }
                ]
            };
            filteredFields.push(storageTypeFilter);
        }
        setFilterFields(filteredFields);
    };

    const getTags = async () => {
        try {
            const res = await httpRequest('GET', `${ApiEndpoints.GET_USED_TAGS}`);
            if (res) setTagList(res);
        } catch (err) {
            return;
        }
    };

    const getTagsFilter = () => {
        const fields = tagList.map((tag) => {
            return {
                name: tag.name,
                color: tag.color,
                checked: false
            };
        });
        const tagFilter = {
            name: 'tags',
            value: 'Tags',
            labelType: labelType.BADGE,
            filterType: filterType.CHECKBOX,
            fields: fields
        };
        let filteredFields = filterFields;
        const tagLocation = filterFields.findIndex((x) => x.name === 'tags');
        tagLocation === -1 ? filteredFields.splice(0, 0, tagFilter) : filteredFields.splice(tagLocation, 1, tagFilter);
        setFilterFields(filteredFields);
    };

    const flipOpen = () => {
        filterDispatch({ type: 'SET_IS_OPEN', payload: !filterState.isOpen });
    };

    const handleFilter = () => {
        let objTags = [];
        let objCreated = [];
        let objStorage = [];
        let objUsage = null;
        let objType = null;
        let data = state?.domainList;
        switch (filterComponent) {
            case 'stations':
                if (filterTerms?.find((o) => o.name === 'tags')) {
                    objTags = filterTerms?.find((o) => o.name === 'tags')?.fields?.map((element) => element?.toLowerCase());
                }
                if (filterTerms?.find((o) => o.name === 'created')) {
                    objCreated = filterTerms?.find((o) => o.name === 'created')?.fields?.map((element) => element?.toLowerCase());
                }
                if (filterTerms?.find((o) => o.name === 'storage')) {
                    objStorage = filterTerms?.find((o) => o.name === 'storage')?.fields?.map((element) => element?.toLowerCase());
                }
                if (searchInput !== '' && searchInput?.length >= 2) {
                    data = data.filter((station) => station.station.name.includes(searchInput));
                }
                if (objTags?.length > 0 || objCreated?.length > 0 || objStorage?.length > 0) {
                    data = data
                        ?.filter((item) =>
                            objTags?.length > 0 ? item.tags.some((tag) => objTags?.includes(tag.name)) : !item.tags.some((tag) => objTags?.includes(tag.name))
                        )
                        .filter((item) =>
                            objCreated?.length > 0 ? objCreated?.includes(item.station.created_by_user) : !objCreated?.includes(item.station.created_by_user)
                        )
                        .filter((item) => (objStorage?.length > 0 ? objStorage?.includes(item.station.storage_type) : !objStorage?.includes(item.station.storage_type)));
                }
                dispatch({ type: 'SET_FILTERED_LIST', payload: data });
                return;
            case 'schema':
                if (filterTerms?.find((o) => o.name === 'tags')) {
                    objTags = filterTerms?.find((o) => o.name === 'tags')?.fields?.map((element) => element?.toLowerCase());
                }
                if (filterTerms?.find((o) => o.name === 'created')) {
                    objCreated = filterTerms?.find((o) => o.name === 'created')?.fields?.map((element) => element?.toLowerCase());
                }
                if (filterTerms?.find((o) => o.name === 'usage')) {
                    objUsage = filterTerms?.find((o) => o.name === 'usage').fields[0] === 'Used';
                }
                if (filterTerms?.find((o) => o.name === 'type')) {
                    objType = filterTerms?.find((o) => o.name === 'type').fields[0]?.toLowerCase();
                    // objUsage = filterTerms?.find((o) => o.name === 'usage').fields[0] === 'Used';
                }
                // if (searchInput !== '' && searchInput?.length >= 2) {
                //     data = data.filter((station) => station.station.name.includes(searchInput));
                // }
                if (objTags?.length > 0 || objCreated?.length > 0 || objStorage?.length > 0 || objUsage !== null || objType !== null) {
                    data = data
                        ?.filter((item) =>
                            objTags?.length > 0 ? item.tags.some((tag) => objTags?.includes(tag.name)) : !item.tags.some((tag) => objTags?.includes(tag.name))
                        )
                        ?.filter((item) => (objCreated?.length > 0 ? objCreated?.includes(item.creatd_by_user) : !objCreated?.includes(item.created_by_user)))
                        ?.filter((item) => objUsage !== null && item.used === objUsage);
                    // ?.filter((item) => objType !== null && item.type === objType);
                    // .filter((item) => (objStorage?.length > 0 ? objStorage?.includes(item.station.storage_type) : !objStorage?.includes(item.station.storage_type)));
                }
                dispatch({ type: 'SET_FILTERED_LIST', payload: data });
                return;
            default:
                return;
        }
    };

    const handleApply = () => {
        let filterTerms = [];
        filterState?.filterFields.forEach((element) => {
            let term = {
                name: element.name,
                fields: []
            };
            if (element.filterType === filterType.CHECKBOX) {
                element.fields.forEach((field) => {
                    if (field.checked) {
                        let t = term.fields;
                        t.push(field.name);
                        term.fields = t;
                    }
                });
            } else if (element.filterType === filterType.RADIOBUTTON && element.radioValue !== -1) {
                let t = [];
                t.push(element.fields[element.radioValue].name);
                term.fields = t;
            } else {
                element.fields.forEach((field) => {
                    if (field?.value !== undefined && field?.value !== '') {
                        let t = term.fields;
                        let d = {};
                        d[field.name] = field.value;
                        t.push(d);
                        term.fields = t;
                    }
                });
            }
            if (term.fields.length > 0) filterTerms.push(term);
        });
        setFilterTerms(filterTerms);
        flipOpen();
    };

    const handleClear = () => {
        filterDispatch({ type: 'SET_COUNTER', payload: 0 });
        let filter = filterFields;
        filter.map((filterGroup) => {
            switch (filterGroup.filterType) {
                case filterType.CHECKBOX:
                    filterGroup.fields.map((field) => (field.checked = false));
                case filterType.DATE:
                    filterGroup.fields.map((field) => (field.value = ''));
                case filterType.RADIOBUTTON:
                    filterGroup.radioValue = -1;
            }
        });
        filterDispatch({ type: 'SET_FILTER_FIELDS', payload: filter });
        setFilterTerms([]);
    };

    const handleCancel = () => {
        filterDispatch({ type: 'SET_IS_OPEN', payload: false });
    };
    const handleOpenChange = () => {
        flipOpen();
    };
    const content = <CustomCollapse header="Details" data={filterState?.filterFields} cancel={handleCancel} apply={handleApply} clear={handleClear} />;

    const getPlaceholder = () => {
        switch (filterComponent) {
            case 'stations':
                return 'Search stations';
            case 'schema':
                return 'Search schema';
            default:
                return 'Search';
        }
    };
    return (
        <FilterStoreContext.Provider value={[filterState, filterDispatch]}>
            <SearchInput
                placeholder={getPlaceholder()}
                colorType="navy"
                backgroundColorType="gray-dark"
                width="288px"
                height="34px"
                borderColorType="none"
                boxShadowsType="none"
                borderRadiusType="circle"
                iconComponent={<img src={searchIcon} alt="searchIcon" />}
                onChange={handleSearch}
                value={searchInput}
            />
            <Popover className="filter-menu" placement="bottomLeft" content={content} trigger="click" onOpenChange={handleOpenChange} open={filterState.isOpen}>
                <Button
                    className="modal-btn"
                    width="110px"
                    height={height}
                    placeholder={
                        <div className="filter-container">
                            <img src={filterImg} width="25" alt="filter" />
                            <label className="filter-title">Filters</label>
                            {filterTerms?.length > 0 && filterState?.counter > 0 && <div className="filter-counter">{filterState?.counter}</div>}
                        </div>
                    }
                    colorType="black"
                    radiusType="circle"
                    backgroundColorType="white"
                    fontSize="14px"
                    fontWeight="bold"
                    boxShadowStyle="login-input"
                    onClick={() => {}}
                />
            </Popover>
        </FilterStoreContext.Provider>
    );
};
export const FilterStoreContext = createContext({});
export default Filter;
