app.factory('$utility', ($window, $http) => {
  return {
    get $http() {
      return $http
    },
    // get $params() {
    //     return $routeParams;
    // },
    get $message() {
      return {
        product: {
          error: {
            get OVER_QUANTITY() {
              return 'Đã vượt quá số lượng hàng!'
            },
          },
        },
        user: {
          success: {
            CHANGE_PASSWORD() {
              return 'Cập nhật mật khẩu thành công!'
            },
          },
          error: {
            CHANGE_PASSWORD() {
              return 'Cập nhật mật khẩu thất bại!'
            },
          },
        },
        mail: {
          success: {
            RESET_PASSWORD() {
              return 'Chúng tôi đã gửi một liên kết đặt lại mật khẩu đến email của bạn. Nếu bạn không thấy email, hãy kiểm tra thư rác của bạn.'
            },
          },
          error: {
            RESET_PASSWORD(code, message) {
              switch (code) {
                case -1:
                  return 'Không thể kết nối đến server. Vui lòng kiểm tra lại server!'
                case 500:
                  return message ? message : 'Không tìm thấy địa chỉ email.'
                default:
                  return 'Không thể gửi mail.'
              }
            },
          },
        },
      }
    },
    // get $templateUrl() {
    //     return {
    //         getHomeTemplates: () => {
    //         },
    //         getProductTemplates: () => {
    //         },
    //     };
    // },
    get $storage() {
      const local = $window.localStorage
      const session = $window.sessionStorage
      const json = {
        string: (value) => {
          return JSON.stringify(value)
        },
        parse: (value) => {
          return value && JSON.parse(value)
          // try {
          //     return JSON.parse(value);
          // } catch (err) {
          //     console.log(err);
          // }
        },
      }

      class Local {
        set(key, value) {
          local.setItem(key, json.string(value))
        }

        get(key) {
          let value = json.parse(local.getItem(key))
          return value ? value : this.remove(key)
        }

        remove(key) {
          local.removeItem(key)
        }

        clear() {
          local.clear()
        }
      }

      class Session {
        set(key, value) {
          session.setItem(key, json.string(value))
        }

        get(key) {
          let value = json.parse(session.getItem(key))
          return value ? value : this.remove(key)
        }

        remove(key) {
          session.removeItem(key)
        }

        clear() {
          session.clear()
        }
      }

      return {
        local: new Local(),
        session: new Session(),
      }
    },
    get $url() {
      class UrlService {
        redirect(url) {
          $window.location.href = url
        }
      }

      return new UrlService()
    },
    get $serverUrl() {
      const host = `http://localhost:8888`
      const apiUrl = `${host}/api/v1`
      return {
        apiUrl: apiUrl,
        api: {
          categories: `${apiUrl}/categories`,
          products: `${apiUrl}/products?projection=withCategory`,
          orders: `${apiUrl}/orders`,
          users: `${apiUrl}/users?projection=withRoles`,
          roles: `${apiUrl}/roles`,
          // users: '/admin/assets/data/users.json',
          // roles: '/admin/assets/data/roles.json',
          ordersByCustomer: (username) =>
            `${apiUrl}/orders/search/byCustomer?username=${username}&projection=basic`,
          // orderWithDetails: (orderId) => `${apiUrl}/orders/${orderId}?projection=orderWithDetails`
        },
        checkout: `${host}/cart/checkout`,
      }
    },
    // get $url() {
    //     class UrlService {
    //         redirect(url) {
    //             $window.location.href = url;
    //         }
    //
    //         redirectToProductPage() {
    //             this.redirect("/#!product");
    //         }
    //
    //         redirectToHomePage() {
    //             this.redirect("/");
    //         }
    //
    //         redirectToLoginPage() {
    //             this.redirect("/#!login");
    //         }
    //     }
    //
    //     return new UrlService();
    // },
    get $data() {
      const apiUrls = this.$serverUrl.api
      return {
        fetch($scope, { name, url }) {
          if (!url) url = apiUrls[name]
          console.log('fetch', name, 'from', url)
          $http
            .get(url)
            .then((resp) => {
              $scope[name] = resp.data._embedded[name]
              console.log(name, resp.data._embedded[name])
            })
            .catch((err) => console.error(err))
        },
        fetchOne(url, callBackFn) {
          $http
            .get(url)
            .then((resp) => callBackFn(resp))
            .catch((err) => console.error(err))
        },
      }
    },
  }
})

app.factory('$cart', ($utility) => {
  const $message = $utility.$message
  const $local = $utility.$storage.local

  class Cart {
    #items
    #cart_local_name = 'cart'

    constructor() {
      this.#items = new Map()
      this.getFromLocal()
    }

    get numberOfItems() {
      return this.#items.size
    }

    get totalAmount() {
      return this.values
        .map((item) => this.getItemQuantity(item.id) * item.price)
        .reduce((total, item) => total + item, 0)
    }

    get totalQuantity() {
      return this.values
        .map((item) => this.getItemQuantity(item.id))
        .reduce((total, item) => total + item, 0)
    }

    get values() {
      // return [...this.#items.values()].map(item => ({...item, _links: undefined}));
      return [...this.#items.values()]
    }

    getItem(id) {
      return this.#items.get(id)
    }

    getItemQuantity(id) {
      const item = this.getItem(id)
      return item ? item.quantity : 0
    }

    contains(productId) {
      return this.#items.has(productId)
    }

    addItem(product, quantityToAdd) {
      let prodInCart = this.getItem(product.id)
      quantityToAdd = quantityToAdd ? quantityToAdd : 1
      const quantity = quantityToAdd + (prodInCart ? prodInCart.quantity : 0)
      if (quantity > product.quantity) {
        Swal.fire({
          icon: 'error',
          title: 'Failed...',
          text: $message.product.error.OVER_QUANTITY,
        })
        return
      }
      this.#items.set(product.id, { ...product, quantity: quantity })
      this.saveToLocal()
      return true
    }

    removeItem(productId) {
      this.#items.delete(productId)
      this.saveToLocal()
    }

    reduceQuantity(prod) {
      if (prod.quantity === 1) {
        const result = confirm('Xoá sản phẩm khỏi giỏ hàng?')
        if (result) {
          this.removeItem(prod.id)
          return
        }
        return
      }
      prod.quantity -= 1
      this.saveToLocal()
    }

    clear() {
      this.#items.clear()
      this.saveToLocal()
      console.log('cart has been cleared')
    }

    saveToLocal() {
      console.log('save to local')
      $local.set(this.#cart_local_name, this.values)
    }

    getFromLocal() {
      const items = $local.get(this.#cart_local_name)
      if (items) items.forEach((item) => this.#items.set(item.id, item))
    }
  }

  return new Cart()
})
