app.controller('productCtrl', function ($scope, $utility) {
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  )
  const tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  )
  const { $serverUrl, $data, $http } = $utility
  $scope.title = 'product controller'
  $scope.search = {}
  // $data.fetch($scope, { name: 'products' })
  // $data.fetch($scope, { name: 'categories' })
  const productsUrl = $serverUrl.api.products
  const categoriesUrl = $serverUrl.api.categories

  $http
    .get(`${categoriesUrl}?projection=withId`)
    .then((resp) => {
      $scope.categories = resp.data._embedded.categories
      $scope.fetchProducts()
    })
    .catch((err) => console.error(err))
  $scope.log = (prod) => {
    console.log(prod)
  }
  $scope.filterByPrice = () => {
    $scope.viewProducts = $scope.products
      .filter((item) =>
        $scope.minPrice ? item.price >= $scope.minPrice : true
      )
      .filter((item) =>
        $scope.maxPrice ? item.price <= $scope.maxPrice : true
      )
  }

  $scope.$watch('search.category', function () {
    if (!$scope.search.category) $scope.search.category = undefined
  })
  $scope.outOfStock = (state) => {
    $scope.search.quantity = state ? 0 : undefined
    $scope.$apply()
    console.log($scope.search.quantity)
  }
  $scope.edit = (product) => {
    $scope.formData = angular.copy(product)
    const category = $scope.categories.find(
      (item) => item.id === product.categoryId
    )
    $scope.formData.category = category
    $scope.formData.price = Math.round($scope.formData.price)
    $scope.formImage = product.images.length ? product.images[0].url : ''
  }

  $scope.fetchProducts = () => {
    console.log(productsUrl)
    $http
      .get(`${productsUrl}&size=100`)
      .then((resp) => {
        console.log(resp.data)
        const arr = resp.data._embedded.products.map((item) => {
          // $scope.isProductSold(item)
          return {
            ...item,
            category: $scope.categories.find(
              (cate) => cate.id === item.categoryId
            ),
          }
        })
        $scope.products = arr
        $scope.viewProducts = arr
      })
      .catch((err) => console.error(err))
  }
  $scope.formClear = () => {
    $scope.formData = {
      available: true,
    }
    $scope.formImage = '/assets/upload-icon.jpeg'
  }

  $scope.openNewProductForm = () => {
    $scope.formClear()
  }

  $scope.showFormModal = () => {
    document.getElementById('productName').focus()
  }

  $scope.previewImage = (fileList) => {
    let file
    if (fileList && fileList[0]) {
      file = fileList[0]
      console.log('File:', file)
    } else return

    const reader = new FileReader()
    reader.onload = (event) => {
      const preview = $('#imagePreview')
      $scope.formData.files = fileList
      $scope.formImage = event.target.result
      preview.hide()
      preview.fadeIn(300)
      preview.attr('title', file.name)
      console.log(preview.tooltipList)
      new bootstrap.Tooltip(preview)
      $scope.$apply()
    }
    reader.readAsDataURL(file)
  }
  $scope.updateProduct = (prod) => {
    const product = prod ? prod : $scope.formData
    const url = product._links.self.href
    console.log(url, product)
    if (!validateProduct(product)) return
    $http
      .put(product._links.self.href, {
        ...product,
        files: undefined,
        images: undefined,
      })
      .then((resp) => {
        $scope.upload(product)
        Swal.fire('Updated!', 'Product has been updated.', 'success')
      })
      .catch((err) => {
        Swal.fire('Error!', 'Update product failed.', 'error')
        console.log(err)
        if (prod) throw err
      })
  }
  // $scope.deleteProduct = (prod) => {
  //   console.log(prod)
  // }
  $scope.deleteProduct = (prod) => {
    const productToDel = prod
      ? prod
      : $scope.formData.id
      ? $scope.formData
      : null
    if (!productToDel) return
    const deleteFn = (result) => {
      if (result) {
        console.log('is Sold')
        Swal.fire({
          title: 'Errors',
          text: 'You cannot delete a product that has been sold!',
          icon: 'error',
        })
        return
      }
      Swal.fire({
        title: `Are you sure to delete ${productToDel.name}?`,
        text: "You won't be able to revert this!",
        imageUrl: productToDel.image,
        imageWidth: 200,
        imageHeight: 150,
        icon: 'warning',
        imageAlt: productToDel.name,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
      }).then((result) => {
        if (result.isConfirmed) {
          console.log(`I'm gonna delete this product`)
          $http
            .delete(productToDel._links.self.href)
            .then((resp) => {
              console.log(resp)
              Swal.fire('Deleted!', 'Product has been deleted.', 'success')
              const delIndex = findProductIndex(productToDel, $scope.products)
              $scope.products.splice(delIndex, 1)
            })
            .catch((err) => {
              console.log(err)
              Swal.fire('Error!', 'Cannot delete products.', 'error')
            })
        }
      })
    }
    $scope.isProductSold(prod, deleteFn)
  }

  $scope.createProduct = () => {
    const product = $scope.formData
    console.log(product)
    if (!validateProduct(product)) return

    const submitProduct = {
      ...product,
      createDate: new Date().getTime(),
      categoryId: product.category.id,
      category: undefined,
      fileList: undefined,
    }
    $http
      .post(`${$serverUrl.apiUrl}/products`, submitProduct)
      .then((resp) => {
        const savedProduct = {
          ...resp.data,
          category: product.category,
          files: product.files,
        }
        //!todo: upload image
        $scope.upload(savedProduct)
        Swal.fire(
          'Saved!',
          'Product has been saved to the database.',
          'success'
        )
        $scope.products.unshift(savedProduct)
        $scope.formClear()
        $('#staticBackdrop').modal('hide')
      })
      .catch((err) => {
        console.error(err)
        Swal.fire('Error!', 'Cannot saved product to database.', 'error')
      })
  }

  $scope.updateAvailable = (prod) => {
    try {
      $scope.updateProduct(prod)
    } catch {
      prod.available = !prod.available
    }
  }
  $scope.isProductSold = (prod, deleteFn) => {
    const url = prod._links.orderDetails.href.replace('{?projection}', '')
    $http
      .get(url)
      .then((resp) => {
        const embedded = resp.data._embedded
        const result = embedded && embedded.orderDetails.length
        deleteFn(result)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  $scope.upload = function (prod) {
    if (!prod.files) {
      return
    }
    const url = prod._links.imageUpload.href
    const form = new FormData()
    form.append('files', prod.files[0])
    form.append('clientId', prod.id)
    form.append('folder', 'asm-java6')
    form.append('type', 'product')
    for (const value of form.values()) {
      console.log(value)
    }
    $http
      .post(url, form, {
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined,
        },
      })
      .then((resp) => console.log('Upload image success'))
      .catch((err) => console.error(err))
  }
})

function fetchLocal($scope, $data) {
  const url = `/admin/assets/data/products.json`
  const categoriesUrl = `/admin/assets/data/categories.json`
  $data.fetchOne(url, (resp) => {
    $scope.products = resp.data._embedded.products
  })
  $data.fetchOne(categoriesUrl, (resp) => {
    $scope.categories = resp.data._embedded.categories
    console.log($scope.categories)
  })
}

function validateProduct(product) {
  if (!product.category) {
    Swal.fire('Error!', 'Please select one category.', 'error')
    return false
  }
  return true
}

function findProductIndex(prod, products) {
  return products.findIndex((item) => item.id === prod.id)
}
