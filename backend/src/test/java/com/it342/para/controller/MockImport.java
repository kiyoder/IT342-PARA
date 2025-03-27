package com.it342.para.controller;

import com.it342.para.service.UserService;

public @interface MockImport {
    Class<UserService> value();
}
