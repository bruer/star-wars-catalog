function request(url) {

    const secureUrl = url.includes("https") ? url : url.replace("http", "https")

    const promise = fetch(secureUrl)
        .then(response => response.json())
        .catch(error => console.log(error))

    return promise
}

async function fetchFirstPage() {

    const firstPageData = await request("https://swapi.dev/api/people/?page=1")

    return firstPageData
}

async function fetchHomeworld(url) {

    const data = await request(url)

    const { name, climate, terrain, population } = data

    const properties = [
        `${name}`,
        `population: ${population}`,
        `climate: ${climate}`,
        `terrain: ${terrain}`,
    ]
    
    const info = (list, data) => fillList(list, data, createListItem)
    const list = createList(info, properties)

    list.setAttribute("class", "homeworld")

    return list
}

async function fetchSpecies(url) {

    const data = await request(url[0])

    const {
        name,
        classification,
        designation,
        average_height,
        average_lifespan,
        language
    } = data

    const unit = (property, unit) => isNaN(property) ? "" : unit

    const properties = [
        `${name}`,
        `Classification: ${classification}`,
        `Designation: ${designation}`,
        `Language: ${language}`,
        `Average height: ${average_height} ${unit(average_height, "cm")}`,
        `Average lifespan: ${average_lifespan} ${unit(average_lifespan, "years")}`,
    ]

    const info = (list, data) => fillList(list, data, createListItem)
    const list = createList(info, properties)

    list.setAttribute("class", "species")

    return list
}

async function fetchFilms(urls) {

    const list = document.createElement("ul")

    for (const url of urls) {

        const data = await request(url)

        const { episode_id, title, release_date } = data

        const content = `Episode ${episode_id} - ${title} (${release_date.slice(0, 4)})`

        const item = createListItem(content)

        list.append(item)
    }
    return list
}

function infoItem(property) {

    let { value, label, additional } = property

    const propertyValueIsEmpty = () => value.constructor === Array && value.length < 1

    const propertyValueIncludes = searchString =>
        typeof value === "string" ?
            value.includes(searchString) :
            value[0].includes(searchString)

    const createFetchButton = fetchProperty => {

        const handleToggleEvent = ({ target }) => {

            let label = target.innerHTML

            target.innerHTML =
                `${label.includes("Show") ?
                    "Hide" : "Show"} ${label.split(" ").pop()}`

            const info = target.nextSibling

            info.classList.toggle("hidden")

        }

        const handleFetchEvent = ({ target }) => {

            const info = target.nextSibling

            info.classList.add("hidden")

            fetchProperty(value).then(infoList => {

                infoList.classList.add("info-list", "hidden")

                valueContainer.replaceWith(infoList)

            })
            .catch(error => console.log(error))

            target.removeEventListener("click", handleFetchEvent)
        }

        const btn = document.createElement("button")

        btn.setAttribute("disabled", "")

        btn.addEventListener("click", handleFetchEvent)
        btn.addEventListener("click", handleToggleEvent)

        return btn
    }

    let labelContainer = document.createElement("p")
    let valueContainer = document.createElement("p")

    if (propertyValueIsEmpty()) {

        valueContainer.append("unknown")

    }
    else if (propertyValueIncludes("planets")) {

        label = "Fetch " + label

        labelContainer = createFetchButton(fetchHomeworld)

    }
    else if (propertyValueIncludes("species")) {

        label = "Fetch " + label

        labelContainer = createFetchButton(fetchSpecies)

    }
    else if (propertyValueIncludes("films")) {

        label = "Fetch " + label

        labelContainer = createFetchButton(fetchFilms)

    }
    else {

        valueContainer.append(`${value} ${isNaN(value) ? "" : additional}`)

    }

    labelContainer.append(label)

    valueContainer.setAttribute("class", "info-value")
    labelContainer.setAttribute("class", "info-label")

    const item = createListItem(labelContainer)
    item.append(valueContainer)

    return item
}

function personItem(person) {

    const {
        name,
        gender,
        birth_year,
        height,
        mass,
        homeworld,
        species,
        films
    } = person

    const properties = [
        { value: gender, label: "Gender", additional: "" },
        { value: birth_year, label: "Birth year", additional: "" },
        { value: height, label: "Height", additional: " cm" },
        { value: mass, label: "Mass", additional: " kg" },
        { value: species, label: "Species", additional: "" },
        { value: homeworld, label: "Homeworld", additional: "" },
        { value: films, label: "Films", additional: "" },
    ]

    const info = (list, data) => fillList(list, data, infoItem)

    const btn = document.createElement("button")
    const infoList = createList(info, properties)
    const item = createListItem(btn)

    btn.setAttribute("class", "name hide-color")

    infoList.setAttribute("class", "info")
    infoList.setAttribute("class", "info hidden")

    item.setAttribute("class", "person")

    btn.addEventListener("click", ({ target }) => {

        target.nextSibling.querySelectorAll("button").forEach(btn => {

            btn.toggleAttribute("disabled")

        })

        target.classList.toggle("hide-color")
        target.nextSibling.classList.toggle("hidden")

    })

    btn.append(name)
    item.append(infoList)

    return item
}

function fillList(list, data, typeOfItem) {

    data.forEach(resource => {

        const item = typeOfItem(resource)

        list.append(item)
    })

    return list
}

function createListItem(content) {

    const item = document.createElement("li")

    item.append(content)

    return item
}

function createList(typeOfList, resource) {

    const container = document.createElement("ul")

    const list = typeOfList(container, resource)

    return list
}

function updatePage(url) {

    request(url).then(pageData => {

        const getPeople = (list, person) => fillList(list, person, personItem)

        const getAllPeople = (list, url) => {

            const searchPeople = (list, nextPage) => {

                if (nextPage) {

                    request(nextPage).then(page => {

                        fillList(list, page.results, personItem)

                        if (!list.childElementCount) {

                            const message = document.createElement("p")
                            message.setAttribute("class", "search-message")
                            message.append("¯\\_(ツ)_/¯")

                            list.replaceWith(message)
                        }

                        searchPeople(list, page.next)

                    })
                    .catch(error => console.log(error))
                }
            }

            searchPeople(list, url)

            return list
        }

        const getCurrentPage = menu => {

            const pageNumber = page => parseInt(page.slice(-1))

            const currentPageNumber = pageData.next ?
                pageNumber(pageData.next) - 1 : pageNumber(pageData.previous) + 1

            const currentPage = menu.options[currentPageNumber - 1]

            return currentPage
        }

        const createMenu = firstPageData => {

            const menu = document.createElement("select")
            menu.setAttribute("class", "select-page")

            const { count, results } = firstPageData

            const numberOfPages = Math.ceil(count / results.length)

            for (let pageNumber = 1; pageNumber <= numberOfPages; pageNumber++) {

                const option = document.createElement("option")

                option.setAttribute("value", pageNumber)

                option.append(pageNumber)
                menu.append(option)
            }

            return menu
        }

        const updateList = (typeOfList, resource) => {

            const oldList = document.querySelector(".bottom").firstElementChild

            const newList = createList(typeOfList, resource)
            newList.setAttribute("class", "people")

            oldList.replaceWith(newList)
        }

        if (pageData.results) {

            const nextBtn = document.querySelector(".next")
            const previousBtn = document.querySelector(".previous")
            const searchField = document.querySelector(".search-field")

            const handleSelectEvent = ({ target }) => {

                const pageUrl = `https://swapi.dev/api/people/?page=${target.value}`

                if (pageUrl) {

                    updatePage(pageUrl)

                    nextBtn.removeEventListener("click", handleBtnEvent)
                    previousBtn.removeEventListener("click", handleBtnEvent)

                    searchField.removeEventListener("input", handleSearchEvent)
                }
            }

            const handleBtnEvent = ({ target }) => {

                const property = target.getAttribute("class").split(" ").pop()
                const pageUrl = pageData[property]

                if (pageUrl) {

                    updatePage(pageUrl)

                    nextBtn.removeEventListener("click", handleBtnEvent)
                    previousBtn.removeEventListener("click", handleBtnEvent)

                    searchField.removeEventListener("input", handleSearchEvent)
                }
            }

            const handleSearchEvent = ({ target }) => {

                const navigation = document.querySelector("nav")
                const bottomOfContainer = document.querySelector("main .bottom")

                const pageUrl = `https://swapi.dev/api/people/?search=${target.value}`

                if (target.value.length < 1) {

                    navigation.classList.remove("hidden")
                    bottomOfContainer.classList.remove("hide-margin")

                    updateList(getPeople, pageData.results)
                }
                else {

                    navigation.classList.add("hidden")
                    bottomOfContainer.classList.add("hide-margin")

                    updateList(getAllPeople, pageUrl)
                }
            }

            const updateMenu = () => {

                const oldMenu = document.querySelector(".select-page")

                fetchFirstPage().then(firstPageData => {

                    const newMenu = createMenu(firstPageData)
                    const currentPage = getCurrentPage(newMenu, pageData)

                    currentPage.setAttribute("selected", "")

                    newMenu.addEventListener("input", handleSelectEvent)

                    oldMenu.replaceWith(newMenu)
                })
                .catch(error => console.log(error))
            }

            const updateButtons = () => {

                nextBtn.addEventListener("click", handleBtnEvent)
                previousBtn.addEventListener("click", handleBtnEvent)

            }

            const updateSearch = () => {

                searchField.addEventListener("focus", ({ target }) => {
                    target.removeAttribute("placeholder")
                })

                searchField.addEventListener("blur", ({ target }) => {
                    target.setAttribute("placeholder", "search for a character")
                })

                searchField.addEventListener("input", handleSearchEvent)

            }

            updateMenu()
            updateButtons()
            updateSearch()
            updateList(getPeople, pageData.results)

        }

        else {

            updateList(getPeople, [pageData])

        }
    })
    .catch(error => console.log(error))
}

updatePage("https://swapi.dev/api/people/")